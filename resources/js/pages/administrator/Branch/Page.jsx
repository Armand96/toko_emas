import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { PlusCircleIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import FilterBar from '../../../components/FilterBar';
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
        // { name: 'pic', error_message: 'PIC wajib diisi' },
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
            const res = await BranchApis.GetBranch(`?page=${page}&limit=${pageSize}${branch_name ? `&branch_name=${branch_name}` : ''}${status ? `&is_active=${status}` : ''}`);
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
            if (submitData.pic) body.append('pic', submitData.pic);
            body.append('branch_open_date', submitData.branch_open_date);
            body.append('is_active', submitData.is_active ? 1 : 0);
            body.append('branch_code', submitData.branch_code);
            body.append('lokasi_cabang', submitData.lokasi_cabang);
            const cleanedPhones = (submitData.phone_numbers || '').split(',').map(p => p.trim()).filter(Boolean).join(',');
            body.append('phone_numbers', cleanedPhones);

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
        { header: 'Tanggal Buka', accessor: 'branch_open_date', },
        {
            header: 'Status',
            accessor: 'is_active',
            render: (row) => {
                const isActive = row.is_active === 1;
                return (
                    <Badge tone={isActive ? 'success' : 'gray'}>
                        {isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                );
            }
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    <ActionButton variant="view" onClick={() => handleOpenModal('view', row)} />
                    <ActionButton variant="edit" onClick={() => handleOpenModal('edit', row)} />
                    <ActionButton variant="bank" onClick={() => handleOpenModal('bank', row)} />
                </ActionButtonGroup>
            )
        }
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
            <FilterBar
                value={search}
                onChange={setSearch}
                fields={[
                    { name: 'search', type: 'search', placeholder: 'Cari cabang...' },
                    { name: 'status', type: 'dropdown', placeholder: 'Pilih status', options: [{ value: '1', label: 'Aktif' }, { value: '0', label: 'Tidak Aktif' }] },
                ]}
            />
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
