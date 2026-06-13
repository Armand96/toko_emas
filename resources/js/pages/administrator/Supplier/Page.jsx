import { useState, useEffect } from 'react';
import { UserPlusIcon, PencilSimpleLineIcon, EyeIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import SupplierApis from "../../../Services/Supplier.apis";
import LoadingStore from '../../../Store/LoadingStore';
import { useDebounce } from 'use-debounce';
import ModalSupplier from './Modal';

const MasterSupplier = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [search, setSearch] = useState({ name: '' });
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

    const fetchData = async (page = 1, pageSize = 10, name = '') => {
        setLoading(true);
        try {
            const res = await SupplierApis.GetSupplier(`?page=${page}&limit=${pageSize}${name ? `&name=${name}` : ''}`);
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
            fetchData(1, paramFetch.pageSize, search.name);
        }
    }, [searchBounce]);

    const handleOpenModal = (mode, record = null) => {
        setFormData(mode === 'add' ? { is_active: false } : { ...record });
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
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.is_active ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
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
                </div>
            )
        }
    ];

    const onChangePage = (page) => {
        fetchData(page, paramFetch.pageSize, search.name);
    };

    const onChangePageSize = (pageSize) => {
        fetchData(1, pageSize, search.name);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Supplier"
                description="Kelola data supplier untuk mendukung proses transaksi pembelian."
                icon={UserPlusIcon}
                onClick={() => handleOpenModal('add')}
                textButton="Tambah Supplier"
            />
            <div className="w-full lg:w-1/3">
                <InputGroup
                    fields={[{
                        name: 'name',
                        label: 'Cari Supplier',
                        type: 'text',
                        placeholder: 'Cari...'
                    }]}
                    formData={search}
                    cols='1'
                    onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
                />
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
            <ModalSupplier
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

export default MasterSupplier;
