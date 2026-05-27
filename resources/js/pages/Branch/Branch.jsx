import { useState } from 'react';
import { PlusCircleIcon, PencilSimpleLineIcon, TrashIcon, EyeIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import Table from "../../components/Table/Table";
import Modal from "./Modal";

const Branch = () => {
    const [data, setData] = useState([
        { id: 1, branch_code: 'CBG-001', branch_name: 'Promas Pusat', address: 'Jl. Jendral Sudirman No. 123, Jakarta', pic: 'Budi Santoso', open_date: '2024-01-15', status: ['active'] },
        { id: 2, branch_code: 'CBG-002', branch_name: 'Promas Bandung', address: 'Jl. Asia Afrika No. 45, Bandung', pic: 'Siti Rahma', open_date: '2024-06-20', status: [] },
        { id: 3, branch_code: 'CBG-003', branch_name: 'Promas Surabaya', address: 'Jl. Basuki Rahmat No. 88, Surabaya', pic: 'Andi Wijaya', open_date: '2025-02-10', status: ['active'] }
    ]);
    const [requiredFields, setRequiredFields] = useState([
        { name: 'branch_code', error_message: 'Kode cabang wajib diisi' },
        { name: 'branch_name', error_message: 'Nama cabang wajib diisi' },
        { name: 'address', error_message: 'Alamat wajib diisi' },
        { name: 'pic', error_message: 'PIC wajib diisi' },
        { name: 'open_date', error_message: 'Tanggal buka cabang wajib diisi' }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [isView, setIsView] = useState(false);

    const handlePaginate = (page, pageSize) => {

    };

    const handleOpenModal = (mode, record = null) => {
        if (mode === 'add') {
            setFormData({ status: [] });
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

        console.log(newErrors)

        if (hasError) {
            setFormError(newErrors);
            return;
        }

        if (submitData.id) {
            setData(prev => prev.map(item => item.id === submitData.id ? submitData : item));
        } else {
            setData(prev => [...prev, { ...submitData, id: Date.now() }]);
        }
        handleCloseModal();
    };


    const handleDelete = (id) => {
        setData(prev => prev.filter(item => item.id !== id));
    };

    const columns = [
        { header: 'Kode Cabang', accessor: 'branch_code', },
        { header: 'Nama Cabang', accessor: 'branch_name', },
        { header: 'Alamat', accessor: 'address', },
        { header: 'PIC', accessor: 'pic', },
        { header: 'Tanggal Buka', accessor: 'open_date', },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const isActive = row.status && row.status.includes('active');
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
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 btn-outline !text-red-500   hover:bg-danger-50 rounded-md transition-colors"
                    >
                        <TrashIcon size={20} />
                    </button>
                </div>
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

            <Table
                columns={columns}
                data={data}
                onPageChange={handlePaginate}
                totalData={data.length}
                currentPage={1}
                pageSize={10}
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
}

export default Branch;
