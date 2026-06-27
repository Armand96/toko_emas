import { useState, useEffect } from 'react';
import { PlusCircleIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import Table from "../../../components/Table/Table";
import ModalUser from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import UsersApis from "../../../Services/User.apis";
import HelperFunctions from '../../../utils/HelperFunctions';
import LoadingStore from '../../../Store/LoadingStore';
import OptionsStore from '../../../Store/OptionsStore';
import PermissionStore from '../../../Store/PermissionStore';
import { useDebounce } from 'use-debounce';

const MasterUser = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [search, setSearch] = useState({ name: '' });
    const [filter, setFilter] = useState({ status: '', branch_id: '' });
    const [showModalAdd, setShowModalAdd] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);
    const [firstLoading, setFirstLoading] = useState(false);
    const [branchOptions, setBranchOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([
        { value: "1", label: "1"}
    ]);
    const [searchBounce] = useDebounce(search, 500);
    const [requiredFields] = useState([
        { name: 'name', error_message: 'Nama lengkap wajib diisi' },
        { name: 'username', error_message: 'Username wajib diisi' },
        // { name: 'email', error_message: 'Email wajib diisi' },
        { name: 'branch_id', error_message: 'Cabang/penempatan wajib diisi' },
        { name: 'role_id', error_message: 'Role wajib diisi' },
        { name: 'password', error_message: 'Password wajib diisi' },
    ]);

    const fetchData = async (page = 1, pageSize = 10, name = '', status = '', branch_id = '') => {
        setLoading(true);
        try {
            const params = `?page=${page}&limit=${pageSize}`
                + (name ? `&name=${name}` : '')
                + (status !== '' ? `&is_active=${status}` : '')
                + (branch_id ? `&branch_id=${branch_id}` : '');
            const res = await UsersApis.GetUser(params);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const branchData = await ensureBranches();
            const RoleData = await UsersApis.GetRole(`?limit=99999`);
            setBranchOptions(HelperFunctions.formatDropdown(branchData, 'id', 'branch_name'));
            setRoleOptions(HelperFunctions.formatDropdown(RoleData?.data, 'id', 'role_name'));
        } catch (error) {
            console.error(error);
        }
    };

    console.log(branchOptions)

    useEffect(() => {
        fetchOptions().then(() => fetchData());
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.pageSize, search.name, filter.status, filter.branch_id);
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
            body.append('name', submitData.name);
            body.append('username', submitData.username);
            body.append('email', submitData.email);
            body.append('branch_id', submitData.branch_id);
            body.append('role_id', submitData.role_id);
            body.append('is_active', submitData.is_active ? 1 : 0);
            if (submitData.phone_number) body.append('phone_number', submitData.phone_number);
            if (!submitData.id) body.append('password', submitData.password);
            if (submitData.id && submitData.password) body.append('password', submitData.password);
            if (submitData.id) body.append('id', submitData.id);

            await submitData?.id
                ? UsersApis.PutUser(submitData.id, body)
                : UsersApis.PostUser(body);
            OptionsStore.getState().invalidate('users');
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
        { header: 'Nama Lengkap', accessor: 'name' },
        { header: 'Username', accessor: 'username' },
        {
            header: 'Cabang',
            accessor: 'branch_id',
            render: (row) => branchOptions.find(b => b.value == row.branch_id)?.label ?? '-'
        },
        {
            header: 'Role',
            accessor: 'role_id',
            render: (row) => roleOptions.find(r => r.value == row.role_id)?.label ?? '-'
        },
        // {
        //     header: 'Last Login',
        //     accessor: 'last_login',
        //     render: (row) => row.last_login ?? '-'
        // },
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
                    {can('update', 'administrator.user') && (
                        <ActionButton variant="edit" onClick={() => handleOpenModal('edit', row)} />
                    )}
                </ActionButtonGroup>
            )
        }
    ];

    const onChangePage = (page) => {
        fetchData(page, paramFetch.pageSize, search.name, filter.status, filter.branch_id);
    };

    const onChangePageSize = (pageSize) => {
        fetchData(1, pageSize, search.name, filter.status, filter.branch_id);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilter = { ...filter, [name]: value };
        setFilter(newFilter);
        fetchData(1, paramFetch.per_page, search.name, newFilter.status, newFilter.branch_id);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="User Management"
                description="Kelola data pengguna untuk akses ke sistem."
                icon={PlusCircleIcon}
                onClick={can('create', 'administrator.user') ? () => handleOpenModal('add') : undefined}
                textButton="Tambah User"
            />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{
                            name: 'name',
                            label: '',
                            type: 'search',
                            placeholder: 'Cari nama...'
                        }]}
                        formData={search}
                        cols='1'
                        onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
                    />
                </div>
                <div className="w-[160px]">
                    <InputGroup
                        fields={[{
                            name: 'status',
                            label: '',
                            type: 'dropdown',
                            placeholder: 'Pilih status',
                            options: [
                                { value: '1', label: 'Aktif' },
                                { value: '0', label: 'Tidak Aktif' },
                            ],
                        }]}
                        formData={filter}
                        cols='1'
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="w-[180px]">
                    <InputGroup
                        fields={[{
                            name: 'branch_id',
                            label: '',
                            type: 'dropdown',
                            placeholder: 'Pilih cabang',
                            options: branchOptions,
                        }]}
                        formData={filter}
                        cols='1'
                        onChange={handleFilterChange}
                    />
                </div>
            </div>
            <Table
                columns={columns}
                data={paramFetch.data}
                onPageChange={onChangePage}
                onPageSizeChange={onChangePageSize}
                total={paramFetch.total}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
            />
            <ModalUser
                isOpen={showModalAdd}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleChange}
                formError={formError}
                isView={isView}
                branchOptions={branchOptions}
                roleOptions={roleOptions}
            />
        </div>
    );
};

export default MasterUser;
