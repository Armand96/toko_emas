import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { PlusCircleIcon, PencilSimpleLineIcon, TrashIcon, EyeIcon, BankIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import LoadingStore from '../../../Store/LoadingStore';
import OptionsStore from '../../../Store/OptionsStore';
import BranchApis from '../../../Services/Branch.apis';
import ModalBank from './ModalBank';

const Branch = () => {
    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 3,
        per_page: 10,
    });
    const [firstLoading, setFirstLoading] = useState(false)
    const setLoading = LoadingStore((state) => state.setLoading);
    const [requiredFields, setRequiredFields] = useState([
        { name: 'branch_code', error_message: 'Kode cabang wajib diisi' },
        { name: 'branch_name', error_message: 'Nama cabang wajib diisi' },
         { name: 'lokasi_cabang', error_message: 'Lokasi cabang wajib diisi' },
        { name: 'address', error_message: 'Alamat wajib diisi' },
        // { name: 'is_active', error_message: 'Status wajib diisi' },
        { name: 'pic', error_message: 'PIC wajib diisi' },
        { name: 'branch_open_date', error_message: 'Tanggal buka cabang wajib diisi' }
        ]);
        const [search, setSearch] = useState({
        search: '',
        status: null,
    })
    const [searchBounce] = useDebounce(search, 500);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);
    const [showModalBank, setShowModalBank] = useState(false);



    const fetchData = async (page = 1, pageSize = 10, branch_name = '', status = '') => {
        setLoading(true);
        try {
            const res = await BranchApis.GetBranch(`?page=${page}&limit=${pageSize}${branch_name ? `&branch_name=${branch_name}` : ''}${status ? `&status=${status}` : ''}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        setLoading(true);
        fetchData();
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.pageSize, search.search, search.status);
        }
    }, [searchBounce]);

    const handlePaginate = (page) => {
        fetchData(page, paramFetch.pageSize, search.search, search.status);
    };

    const handleRow = (pageSize) => {
        fetchData(1, pageSize, search.search, search.status);
    }

    const handleOpenModal = (mode, record = null) => {
        if (mode === 'add') {
            setFormData({ is_active: false});
            setIsView(false);
        } else if (mode === 'edit') {
            const picId = typeof record.pic === 'object' && record.pic !== null ? record.pic.id : record.pic;
            setFormData({...record, is_active: record.is_active === 1 ? true : false, pic: picId});
            setIsView(false);
        } else if (mode === 'view') {
            const picId = typeof record.pic === 'object' && record.pic !== null ? record.pic.id : record.pic;
            setFormData({...record, pic: picId});
            setIsView(true);
        }else if (mode === 'bank') {
            setFormData(record);
            setShowModalBank(true);
            return
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setFormData({});
            setFormError({});
            setIsView(false);
        }, 300);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => {
                const currentValues = prev[name] || [];
                return {
                    ...prev,
                    [name]: checked ? [...currentValues, value] : currentValues.filter(v => v !== value)
                };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (formError[name]) {
            setFormError(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (submitData) => {
        let hasError = false;
        const newErrors = {};

        requiredFields.forEach(field => {
            const value = submitData[field.name];
            if (!value || (typeof value === 'string' && !value.trim())) {
                newErrors[field.name] = field.error_message;
                hasError = true;
            }
        });


        if (hasError) {
            setFormError(newErrors);
            return;
        }

        setLoading(true);
        try {
            const body = new FormData();
            body.append('branch_name', submitData.branch_name);
            body.append('address', submitData.address);
            body.append('pic', submitData.pic);
            body.append('branch_open_date', submitData.branch_open_date);
            body.append('is_active', submitData.is_active ? 1 : 0);
            body.append('branch_code', submitData.branch_code);
            body.append('lokasi_cabang', submitData.lokasi_cabang);

            await submitData?.id ? BranchApis.PutBranch(submitData.id, body) : BranchApis.PostBranch(body);
            OptionsStore.getState().invalidate('branches');
            setTimeout(() => {
                fetchData();
                handleCloseModal();
                setLoading(false)
                showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
            }, 500);


        } catch (error) {
           console.log(error.response?.data);
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };


    const columns = [
        { header: 'Kode Cabang', accessor: 'branch_code', },
        { header: 'Nama Cabang', accessor: 'branch_name', },
        { header: 'Lokasi Cabang', accessor: 'lokasi_cabang', },
        { header: 'Alamat', accessor: 'address', },
        { header: 'PIC', accessor: 'pic', render: (row) => row.pic?.name || '-' },
        { header: 'Tanggal Buka', accessor: 'open_date', },
        {
            header: 'Status',
            accessor: 'is_active',
            render: (row) => {
                const isActive = row.is_active === 1;
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${isActive
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                );
            }
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                       <button
                        onClick={() => handleOpenModal('bank', row)}
                        className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"
                    >
                        <BankIcon size={20} />
                    </button>
                    <button
                        onClick={() => handleOpenModal('view', row)}
                        className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"
                    >
                        <EyeIcon size={20} />
                    </button>
                    <button
                        onClick={() => handleOpenModal('edit', row)}
                        className="p-1.5 btn-outline hover:bg-warning-50 rounded-md cursor-pointer"
                    >
                        <PencilSimpleLineIcon size={20} />
                    </button>
                    {/* <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 btn-outline !text-red-500   hover:bg-danger-50 rounded-md transition-colors"
                    >
                        <TrashIcon size={20} />
                    </button> */}
                </div>
            )
        }
    ];

    const searchFields = [
        { name: 'search', label: '', type: 'search', placeholder: 'Cari cabang...' },
    ];

    const filterFields = [
        { name: 'status', label: '', type: 'dropdown', placeholder: 'Pilih status', options: [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Tidak Aktif' }] },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Branch Management"
                description="Kelola daftar cabang toko emas Anda secara keseluruhan."
                icon={PlusCircleIcon}
                onClick={() => handleOpenModal('add')}
                textButton="Tambah Cabang"
            />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={searchFields}
                        formData={search}
                        cols='1'
                        onChange={(value) => setSearch({ ...search, [value.target.name]: value.target.value })}
                    />
                </div>
                <div className="w-[160px]">
                    <InputGroup
                        fields={filterFields}
                        formData={search}
                        cols='1'
                        onChange={(value) => setSearch({ ...search, [value.target.name]: value.target.value })}
                    />
                </div>
            </div>
            <Table
                columns={columns}
                data={paramFetch.data}
                onPageChange={handlePaginate}
                onPageSizeChange={handleRow}
                total={paramFetch.total}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleChange}
                formError={formError}
                isView={isView}
            />

            <ModalBank
                formData={formData}
                isOpen={showModalBank}
                onClose={() => setShowModalBank(false)}
            />
        </div>
    );
}

export default Branch;
