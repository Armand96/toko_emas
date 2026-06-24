import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { PlusCircleIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import InventoryApis from '../../../Services/Inventory.apis';
import LoadingStore from '../../../Store/LoadingStore';
import HelperFunctions from '../../../utils/HelperFunctions';
import OptionsStore from '../../../Store/OptionsStore';
import PermissionStore from '../../../Store/PermissionStore';
import AuthStore from '../../../Store/AuthStore';

const MasterProduk = () => {
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 2,
        per_page: 10,
    });
    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureCategories = OptionsStore((s) => s.ensureCategories);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const [requiredFields, setRequiredFields] = useState([
        // { name: 'barcode', error_message: 'Kode produk wajib diisi' },
        // { name: 'is_active', error_message: 'Status produk wajib diisi' },
        { name: 'product_name', error_message: 'Nama produk wajib diisi' },
        { name: 'category', error_message: 'Kategori wajib diisi' },
        { name: 'branch', error_message: 'Cabang wajib diisi' }
    ]);

    const [search, setSearch] = useState({
        search: '',
        status: null,
        cabang: null,
    });
    const [searchBounce] = useDebounce(search, 500);

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
            const effectiveBranch = isKasir() && user?.branch_id ? user.branch_id : branch_id;
            const res = await InventoryApis.GetProducts(`?page=${page}&limit=${pageSize}${product_name ? `&product_name=${product_name}` : ''}${category_id ? `&category_id=${category_id}` : ''}${effectiveBranch ? `&branch_id=${effectiveBranch}` : ''}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaginate = (page) => {
        fetchData(page, paramFetch.pageSize, search.search, search.status, search.cabang);
    };

    const handleRow = (pageSize) => {
        fetchData(1, pageSize, search.search, search.status, search.cabang);
    };

    /**
     * Susun formData untuk edit/view.
     * - Jika record punya subcategory_id (>0): category_id = induk, subcategory_id = sub.
     * - Fallback data lama: sub kategori tersimpan di category_id, induk diambil dari parent_id.
     */
    const buildEditFormData = (record) => {
        const hasSub = record.subcategory_id && Number(record.subcategory_id) > 0;
        let category;
        let sub_category;

        if (hasSub) {
            category = record.category_id;
            sub_category = record.subcategory_id;
        } else {
            const categoryList = categoryOptions.find((o) => o.value == record.category_id);
            const parentId = categoryList?.details?.parent_id;
            category = parentId != null ? parentId : record.category_id;
            sub_category = parentId != null ? record.category_id : '';
        }

        return {
            ...record,
            is_active: record.is_active === 1,
            category,
            sub_category,
            branch: record.branch_id,
        };
    };

    const handleOpenModal = (mode, record = null) => {
        if (mode === 'add') {
            setFormData({ is_active: false, branch: [] });
            setIsView(false);
        } else if (mode === 'edit' || mode === 'view') {
            setFormData(buildEditFormData(record));
            setIsView(mode === 'view');
        }
        setIsModalOpen(true);
    };

    console.log(formData)

    useEffect(() => {
        setLoading(true);
        fetchData();
        Promise.all([
            ensureCategories(),
            ensureBranches(),
        ]).then(([categoryData, branchData]) => {
            setCategoryOptions(HelperFunctions.formatDropdown(categoryData, 'id', 'category_name'));
            setBranchOptions(HelperFunctions.formatDropdown(branchData, 'id', 'branch_name'));
        }).catch(error => {
            console.error('Error fetching options:', error);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.pageSize, search.search, search.status, search.cabang);
        }
    }, [searchBounce]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setFormData({});
            setFormError({});
            setIsView(false);
        }, 300);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        if (formError[name]) {
            setFormError(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (submitData) => {
        let hasError = false;
        const newErrors = {};

        requiredFields.forEach(field => {
            const value = submitData[field.name];
            const isEmpty = Array.isArray(value) ? value.length === 0 : (!value || (typeof value === 'string' && !value.trim()));
            if (isEmpty) {
                newErrors[field.name] = field.error_message;
                hasError = true;
            }
        });

        console.log(newErrors)

        if (hasError) {
            setFormError(newErrors);
            return;
        }


        try {
            setLoading(true);

            const buildBody = (branchId) => {
                const body = new FormData();
                body.append('product_name', formData.product_name);
                body.append('description', formData.description);
                body.append('branch_id', branchId);
                body.append('is_active', formData.is_active ? 1 : 0);
                body.append('category_id', formData.category);
                body.append('subcategory_id', formData.sub_category || 0);
                if (formData.barcode) body.append('barcode', formData.barcode);
                return body;
            };

            if (formData?.id) {
                // Edit: single update (branch tetap satu)
                await InventoryApis.PutProducts(formData.id, buildBody(formData.branch));
            } else {
                // Create: bulk — 1 produk per cabang terpilih
                const branches = Array.isArray(formData.branch) ? formData.branch : [formData.branch];
                await Promise.all(branches.map((branchId) => InventoryApis.PostProducts(buildBody(branchId))));
            }

            OptionsStore.getState().invalidate('products');
            setTimeout(() => {
                showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
                handleCloseModal();
                setLoading(false);
                fetchData();
            }, 1000);
        } catch (error) {
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Kode Produk', accessor: 'barcode' },
        { header: 'Nama Produk', accessor: 'product_name' },
        {
            header: 'Kategori',
            accessor: 'category',
            // Konvensi baru: subcategory_id terisi -> category = induk.
            // Data lama: sub tersimpan di category_id -> ambil induk dari parent.
            render: (row) => row.subcategory
                ? row.category?.category_name
                : (row.category?.parent?.category_name || row.category?.category_name || '-')
        },
        {
            header: 'Sub Kategori',
            accessor: 'sub_category',
            render: (row) => row.subcategory?.category_name
                || (row.category?.parent ? row.category?.category_name : '-')
        },
        { header: 'Deskripsi', accessor: 'description' },
        {
            header: 'Cabang',
            accessor: 'branch',
            render: (row) => row.branch?.branch_name || '-'
        },
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
                    {can('update', 'inventory.master_produk') && (
                        <ActionButton variant="edit" onClick={() => handleOpenModal('edit', row)} />
                    )}
                </ActionButtonGroup>
            )
        }
    ];

    const searchFields = [
        { name: 'search', label: '', type: 'search', placeholder: 'Cari produk...' },
    ];

    const parentCategoryOptions = categoryOptions.filter((c) => !c.details?.parent_id);

    const filterFieldsProduk = [
        { name: 'status', label: '', type: 'dropdown', placeholder: 'Pilih kategori', options: parentCategoryOptions },
        ...(!isKasir() ? [{ name: 'cabang', label: '', type: 'dropdown', placeholder: 'Pilih cabang', options: branchOptions }] : []),
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Master Produk"
                description="Kelola daftar produk toko emas Anda secara keseluruhan."
                icon={PlusCircleIcon}
                onClick={can('create', 'inventory.master_produk') ? () => handleOpenModal('add') : undefined}
                textButton="Tambah Produk"
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
                {filterFieldsProduk.map((field) => (
                    <div key={field.name} className="w-[160px]">
                        <InputGroup
                            fields={[field]}
                            formData={search}
                            cols='1'
                            onChange={(value) => setSearch({ ...search, [value.target.name]: value.target.value })}
                        />
                    </div>
                ))}
            </div>
            <Table
                columns={columns}
                data={paramFetch.data}
                onPageChange={handlePaginate}
                onPageSizeChange={handleRow}
                total={paramFetch.total}
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
