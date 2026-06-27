import { useState, useEffect } from 'react';
import { PlusCircleIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import HelperFunctions from '../../../utils/HelperFunctions';
import LoadingStore from '../../../Store/LoadingStore';
import { useDebounce } from 'use-debounce';
import BankApis from '../../../Services/Bank.apis';

const MasterBank = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [search, setSearch] = useState({ category_name: '' });
    const [showModalAdd, setShowModalAdd] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);
    const [firstLoading, setFirstLoading] = useState(false)
    const [searchBounce] = useDebounce(search, 500);
    const [requiredFields, setRequiredFields] = useState([
        { name: 'bank_code', error_message: 'Kode bank wajib diisi' },
        { name: 'bank_name', error_message: 'Nama bank wajib diisi' }
    ]);

    const fetchData = async (page = 1, pageSize = 10, category_name = '') => {
        setLoading(true);
        try {
            const res = await BankApis.GetBankMaster(`?page=${page}&limit=${pageSize}${category_name ? `&bank_name=${category_name}` : ''}`);
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
        setFormData(
            mode === 'add'
                ? { is_active: true }
                : { ...record, is_active: Boolean(Number(record?.is_active)) }
        );
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
            const body = new FormData();
            if (submitData.bank_code) body.append('bank_code', submitData.bank_code);
            if (submitData.bank_name) body.append('bank_name', submitData.bank_name);
            body.append('is_active', (submitData.is_active === true || submitData.is_active === 1 || submitData.is_active === '1') ? 1 : 0);
            if (submitData.id) body.append('id', submitData.id);

            await submitData?.id ? BankApis.PutBankMaster(submitData.id, body) : BankApis.PostBankMaster(body);
            setTimeout(() => {
            showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
            handleCloseModal();
            setLoading(false)
            fetchData();
            }, 500);
        } catch (error) {
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const parentOptions = HelperFunctions.formatDropdown(
        paramFetch.data.filter(item => !item.parent_id),
        'id',
        'category_name'
    );

    const columns = [
        { header: 'Nama Bank', accessor: 'bank_name' },
        { header: 'Kode Bank', accessor: 'bank_code' },
        { header: 'Status', accessor: 'is_active',  render: (row) => {
                const isActive = row.is_active === 1;
                return (
                    <Badge tone={isActive ? 'success' : 'gray'}>
                        {isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                );
            } },
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
            <HeaderSection title="Master Bank" description="Kelola daftar bank." icon={PlusCircleIcon} onClick={() => handleOpenModal('add')} textButton="Tambah Bank" />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup fields={[{ name: 'category_name', label: '', type: 'search', placeholder: 'Cari bank...' }]} formData={search} cols='1' onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })} />
                </div>
            </div>
            <Table columns={columns} data={paramFetch.data} onPageChange={onChangePage} onPageSizeChange={onChangePageSize} total={paramFetch.total} page={paramFetch.current_page} pageSize={paramFetch.per_page} />
            <Modal isOpen={showModalAdd} onClose={handleCloseModal} onSubmit={handleSubmit} formData={formData} onChange={handleChange} formError={formError} isView={isView} parentOptions={parentOptions} />
        </div>
    );
};

export default MasterBank;
