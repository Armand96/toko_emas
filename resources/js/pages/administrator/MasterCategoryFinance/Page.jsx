import { useState, useEffect } from 'react';
import { PlusCircleIcon, PencilSimpleLineIcon, EyeIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import LoadingStore from '../../../Store/LoadingStore';
import { useDebounce } from 'use-debounce';
import FinanceApis from '../../../Services/Finance.apis';

const MasterCategoryFinance = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [search, setSearch] = useState({ category_name: '' });
    const [showModalAdd, setShowModalAdd] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);
    const [firstLoading, setFirstLoading] = useState(false);
    const [searchBounce] = useDebounce(search, 500);
    const [requiredFields] = useState([
        { name: 'category_name', error_message: 'Nama kategori wajib diisi' },
    ]);

    const fetchData = async (page = 1, pageSize = 10, category_name = '') => {
        setLoading(true);
        try {
            const res = await FinanceApis.GetCategoryFinance(`?page=${page}&per_page=${pageSize}${category_name ? `&category_name=${category_name}` : ''}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.pageSize, search.category_name);
        }
    }, [searchBounce]);

    const handleOpenModal = (mode, record = null) => {
        setFormData(mode === 'add' ? { is_active: true } : { ...record, is_active: record.is_active === 1 });
        setIsView(mode === 'view');
        setShowModalAdd(true);
    };

    const handleCloseModal = () => {
        setShowModalAdd(false);
        setTimeout(() => {
            setFormData({});
            setFormError({});
            setIsView(false);
        }, 300);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formError[name]) setFormError(prev => ({ ...prev, [name]: '' }));
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
            const body = {
                category_name: submitData.category_name,
                is_active: submitData.is_active === true ? 1 : 0,
            };

            await (submitData?.id ? FinanceApis.PutCategoryFinance(submitData.id, body) : FinanceApis.PostCategoryFinance(body));
            setTimeout(() => {
                showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
                handleCloseModal();
                setLoading(false);
                fetchData();
            }, 500);
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Nama Kategori', accessor: 'category_name' },
        {
            header: 'Status', accessor: 'is_active', render: (row) => {
                const isActive = row.is_active === 1;
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${isActive
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'bg-danger-50 text-danger-700 border-danger-200'
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
                    <button onClick={() => handleOpenModal('view', row)} className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"><EyeIcon size={20} /></button>
                    <button onClick={() => handleOpenModal('edit', row)} className="p-1.5 btn-outline hover:bg-warning-50 rounded-md cursor-pointer"><PencilSimpleLineIcon size={20} /></button>
                </div>
            )
        }
    ];

    const onChangePage = (page) => {
        fetchData(page, paramFetch.pageSize, search.category_name);
    };

    const onChangePageSize = (pageSize) => {
        fetchData(1, pageSize, search.category_name);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection title="Master Kategori Finance" description="Kelola daftar kategori transaksi keuangan." icon={PlusCircleIcon} onClick={() => handleOpenModal('add')} textButton="Tambah Kategori" />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup fields={[{ name: 'category_name', label: '', type: 'search', placeholder: 'Cari kategori...' }]} formData={search} cols='1' onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })} />
                </div>
            </div>
            <Table columns={columns} data={paramFetch.data} onPageChange={onChangePage} onPageSizeChange={onChangePageSize} total={paramFetch.total} page={paramFetch.current_page} pageSize={paramFetch.per_page} />
            <Modal isOpen={showModalAdd} onClose={handleCloseModal} onSubmit={handleSubmit} formData={formData} onChange={handleChange} formError={formError} isView={isView} />
        </div>
    );
};

export default MasterCategoryFinance;
