import { useState, useEffect } from 'react';
import { PlusCircleIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import FilterBar from '../../../components/FilterBar';
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
        { name: 'type', error_message: 'Tipe wajib dipilih' },
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
                type: submitData.type,
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
            header: 'Tipe', accessor: 'type', render: (row) => (
                <Badge tone={row.type === 'CASH IN' ? 'success' : 'danger'}>
                    {row.type}
                </Badge>
            )
        },
        {
            header: 'Status', accessor: 'is_active', render: (row) => {
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
                </ActionButtonGroup>
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
            <FilterBar
                value={search}
                onChange={setSearch}
                fields={[
                    { name: 'category_name', type: 'search', placeholder: 'Cari kategori...' },
                ]}
            />
            <Table columns={columns} data={paramFetch.data} onPageChange={onChangePage} onPageSizeChange={onChangePageSize} total={paramFetch.total} page={paramFetch.current_page} pageSize={paramFetch.per_page} />
            <Modal isOpen={showModalAdd} onClose={handleCloseModal} onSubmit={handleSubmit} formData={formData} onChange={handleChange} formError={formError} isView={isView} />
        </div>
    );
};

export default MasterCategoryFinance;
