import { useState, useEffect } from 'react';
import { PlusCircleIcon, PencilSimpleLineIcon, EyeIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import InputGroup from '../../../components/FormElement/InputGroup';
import { showAlert } from '../../../utils/showAlert';
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from '../../../utils/HelperFunctions';
import LoadingStore from '../../../Store/LoadingStore';
import { useDebounce } from 'use-debounce';

const MasterKategori = () => {
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
        { name: 'category_name', error_message: 'Nama kategori wajib diisi' },
        { name: 'description', error_message: 'Deskripsi wajib diisi' }
    ]);

    const fetchData = async (page = 1, pageSize = 10, category_name = '') => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetCategories(`?page=${page}&limit=${pageSize}${category_name ? `&category_name=${category_name}` : ''}`);
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
        setFormData(mode === 'add' ? {} : { ...record });
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
            body.append('category_name', submitData.category_name);
            if (submitData.description) body.append('description', submitData.description);
            if (submitData.parent_id) body.append('parent_id', submitData.parent_id);
            if (submitData.id) body.append('id', submitData.id);

            await submitData?.id ? InventoryApis.PutCategories(submitData.id, body) : InventoryApis.PostCategories(body);
            showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
            handleCloseModal();
            setLoading(false)
            fetchData();
        } catch (error) {
            showAlert({ title: 'Gagal', message: 'Gagal menyimpan data', type: 'danger' });
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
        { header: 'Nama Kategori', accessor: 'category_name' },
        {
            header: 'Kategori Utama',
            accessor: 'parent_id',
            render: (row) => parentOptions.find(p => p.value === row.parent_id)?.label
        },
        { header: 'Deskripsi', accessor: 'description' },
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
            <HeaderSection title="Master Kategori" description="Kelola daftar kategori dan sub-kategori produk." icon={PlusCircleIcon} onClick={() => handleOpenModal('add')} textButton="Tambah Kategori" />
            <div className="w-1/3">
                <InputGroup fields={[{ name: 'category_name', label: 'Cari Kategori', type: 'text', placeholder: 'Ketik nama kategori...' }]} formData={search} cols='1' onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })} />
            </div>
            <Table columns={columns} data={paramFetch.data} onPageChange={onChangePage} onPageSizeChange={onChangePageSize} total={paramFetch.total} page={paramFetch.current_page} pageSize={paramFetch.per_page} />
            <Modal isOpen={showModalAdd} onClose={handleCloseModal} onSubmit={handleSubmit} formData={formData} onChange={handleChange} formError={formError} isView={isView} parentOptions={parentOptions} />
        </div>
    );
};

export default MasterKategori;
