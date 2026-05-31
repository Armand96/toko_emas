import { useEffect, useState } from 'react';
import { PlusCircleIcon, PencilSimpleLineIcon, TrashIcon, EyeIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import InventoryApis from '../../../Services/Inventory.apis';
import LoadingStore from '../../../Store/LoadingStore';


const MasterProduk = () => {
    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 2,
        per_page: 10,
    });
    const setLoading = LoadingStore((state) => state.setLoading);
    const [requiredFields, setRequiredFields] = useState([
        { name: 'product_code', error_message: 'Kode produk wajib diisi' },
        { name: 'is_active', error_message: 'Status produk wajib diisi' },
        { name: 'product_name', error_message: 'Nama produk wajib diisi' },
        { name: 'category_id', error_message: 'Kategori wajib diisi' },
        { name: 'branch_id', error_message: 'Cabang wajib diisi' }
    ]);

    const [search, setSearch] = useState({
        search: '',
        status: null,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);
    const [branchOptions, setBranchOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [firstLoading, setFirstLoading] = useState(false);

       const fetchData = async (page = 1, pageSize = 10, product_name = '', category_id = null, branch_id = null) => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetProducts(`?page=${page}&limit=${pageSize}${product_name ? `&product_name=${product_name}` : ''}${category_id ? `&category_id=${category_id}` : ''}${branch_id ? `&branch_id=${branch_id}` : ''}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaginate = (page) => {
                fetchData(page, paramFetch.pageSize, search.product_name);
    };

    const handleRow = (pageSize) => {
        fetchData(1, pageSize, search.product_name);
    };

    const handleOpenModal = (mode, record = null) => {
        if (mode === 'add') {
            setFormData({ status: 'inactive' });
            setIsView(false);
        } else if (mode === 'edit') {
            setFormData(record);
            setIsView(false);
        } else if (mode === 'view') {
            setFormData(record);
            setIsView(true);
        }
        setIsModalOpen(true);
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, []);

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

    const handleSubmit = (submitData) => {
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

        if (submitData.id) {
            setParamFetch(prev => ({
                ...prev,
                data: prev.data.map(item => item.id === submitData.id ? submitData : item)
            }));
        } else {
            showAlert({
                title: 'Berhasil',
                message: 'Produk berhasil ditambahkan',
                icon: 'success'
            });
            setParamFetch(prev => ({
                ...prev,
                data: [...prev.data, { ...submitData, id: Date.now() }]
            }));
        }
        handleCloseModal();
    };

    const columns = [
        { header: 'Kode Produk', accessor: 'kode_produk' },
        { header: 'Nama Produk', accessor: 'nama_produk' },
        { header: 'Kategori', accessor: 'kategori' },
        { header: 'Sub Kategori', accessor: 'sub_kategori' },
        { header: 'Deskripsi', accessor: 'deskripsi' },
        { header: 'Cabang', accessor: 'cabang' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const isActive = row.status == 'active';
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
                    <button
                        onClick={() => handleOpenModal('view', row)}
                        className="p-1.5 btn-outline text-info-500 hover:bg-info-50 rounded-md transition-colors"
                    >
                        <EyeIcon size={20} />
                    </button>
                    <button
                        onClick={() => handleOpenModal('edit', row)}
                        className="p-1.5 btn-outline !border-primary-500 text-warning-500 hover:bg-warning-50 rounded-md transition-colors"
                    >
                        <PencilSimpleLineIcon size={20} />
                    </button>
                </div>
            )
        }
    ];

    const searchFields = [
        { name: 'search', label: 'Cari Produk', type: 'text' },
        { name: 'status', label: 'Pilih Kategori', type: 'dropdown', options: [{ value: null, label: 'Semua Kategori' }] },
        { name: 'cabang', label: 'Pilih Cabang', type: 'dropdown', options: [{ value: null, label: 'Semua Cabang' }] }
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Master Produk"
                description="Kelola daftar produk toko emas Anda secara keseluruhan."
                icon={PlusCircleIcon}
                onClick={() => handleOpenModal('add')}
                textButton="Tambah Produk"
            />
            <div className="w-3/6">
                <InputGroup
                    fields={searchFields}
                    formData={search}
                    cols='3'
                    onChange={(value) => setSearch({ ...search, [value.target.name]: value.target.value })}
                />
            </div>
            <Table
                columns={columns}
                data={paramFetch.data}
                onPageChange={handlePaginate}
                onPageSizeChange={handleRow}
                totalData={paramFetch.total}
                currentPage={paramFetch.page}
                pageSize={paramFetch.pageSize}
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
        </div>
    );
};

export default MasterProduk;
