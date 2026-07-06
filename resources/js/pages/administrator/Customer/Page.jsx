import { useState, useEffect } from 'react';
import { PlusCircleIcon } from "@phosphor-icons/react";
import CodeBadge from "../../../components/CodeBadge";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import { useQueryParams } from "../../../utils/useQueryParams";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import FilterBar from '../../../components/FilterBar';
import { showAlert } from '../../../utils/showAlert';
import CustomerApis from "../../../Services/Customer.apis";
import LoadingStore from '../../../Store/LoadingStore';
import { useDebounce } from 'use-debounce';
import ModalCustomer from './Modal';
import PermissionStore from '../../../Store/PermissionStore';

const MasterCustomer = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [
        { name: urlName, status: urlStatus, page: urlPage, per_page: urlPerPage },
        setQuery,
    ] = useQueryParams({ name: '', status: '', page: 1, per_page: 10 });
    const [search, setSearch] = useState({ name: urlName, status: urlStatus });
    const [showModalAdd, setShowModalAdd] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);
    const [firstLoading, setFirstLoading] = useState(false);
    const [searchBounce] = useDebounce(search, 500);
    const [requiredFields] = useState([
        { name: 'customer_name', error_message: 'Nama lengkap wajib diisi' },
        { name: 'phone_number', error_message: 'No HP wajib diisi' },
        { name: 'address', error_message: 'Alamat wajib diisi' },
    ]);

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page, limit: pageSize });
            if (params.name) query.append('customer_name', params.name);
            if (params.status !== '' && params.status !== undefined) query.append('is_active', params.status);
            const res = await CustomerApis.GetCustomer(`?${query.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(urlPage, urlPerPage, { name: urlName, status: urlStatus });
    }, []);

    useEffect(() => {
        if (firstLoading) {
            setQuery({ name: searchBounce.name, status: searchBounce.status, page: 1 });
            fetchData(1, paramFetch.pageSize, searchBounce);
        }
    }, [searchBounce]);

    const handleOpenModal = (mode, record = null) => {
        setFormData(mode === 'add' ? { is_active: true } : { ...record, is_active: Boolean(Number(record?.is_active)) });
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

        const fieldsToValidate = submitData?.id
            ? requiredFields.filter(f => f.name !== 'password')
            : requiredFields;

        fieldsToValidate.forEach(field => {
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
            body.append('customer_name', submitData.customer_name);
            body.append('phone_number', submitData.phone_number);
            body.append('address', submitData.address);
            body.append('is_active', submitData.is_active ? 1 : 0);
            if (submitData.id) body.append('id', submitData.id);

            await submitData?.id
                ? CustomerApis.PutCustomer(submitData.id, body)
                : CustomerApis.PostCustomer(body);

            setTimeout(() => {
                showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
                handleCloseModal();
                setLoading(false);
                fetchData();
            }, 500);
        } catch (error) {
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'ID Member',
            accessor: 'customer_code',
            render: (row) => row.customer_code
                ? <CodeBadge variant="table">{row.customer_code}</CodeBadge>
                : '-'
        },
        { header: 'Nama Lengkap', accessor: 'customer_name' },
        { header: 'No HP', accessor: 'phone_number' },
        {
            header: 'Alamat',
            accessor: 'address',
            render: (row) => row.address ?? '-'
        },
        {
            header: 'Status',
            accessor: 'is_active',
            render: (row) => (
                <Badge tone={row.is_active ? 'success' : 'gray'}>
                    {row.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
            )
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    <ActionButton variant="view" onClick={() => handleOpenModal('view', row)} />
                    {can('update') && (
                        <ActionButton variant="edit" onClick={() => handleOpenModal('edit', row)} />
                    )}
                </ActionButtonGroup>
            )
        }
    ];

    const onChangePage = (page) => {
        setQuery({ page, per_page: paramFetch.pageSize });
        fetchData(page, paramFetch.pageSize, search);
    };

    const onChangePageSize = (pageSize) => {
        setQuery({ page: 1, per_page: pageSize });
        fetchData(1, pageSize, search);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Customer"
                description="Kelola data pelanggan untuk mendukung proses transaksi penjualan dan layanan pelanggan."
                icon={PlusCircleIcon}
                onClick={can('create') ? () => handleOpenModal('add') : undefined}
                textButton="Tambah Customer"
            />
            <FilterBar
                value={search}
                onChange={setSearch}
                fields={[
                    { name: 'name', type: 'search', placeholder: 'Cari customer...' },
                    {
                        name: 'status', type: 'dropdown', placeholder: 'Pilih status', width: 'sm:w-[170px]', options: [
                            { value: '1', label: 'Aktif' },
                            { value: '0', label: 'Tidak Aktif' },
                        ]
                    },
                ]}
            />
            <Table
                columns={columns}
                data={paramFetch.data}
                onPageChange={onChangePage}
                onPageSizeChange={onChangePageSize}
                total={paramFetch.total}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
            />
            <ModalCustomer
                isOpen={showModalAdd}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleChange}
                formError={formError}
                isView={isView}
            />
        </div>
    );
};

export default MasterCustomer;
