import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
    EyeIcon,
    CheckSquareOffsetIcon,
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import { showAlert } from '../../../utils/showAlert';
import InputGroup from '../../../components/FormElement/InputGroup';
import FooterActionBar from '../../../components/FooterActionBar';
import InventoryApis from '../../../Services/Inventory.apis';
import HelperFunctions from '../../../utils/HelperFunctions';
import LoadingStore from '../../../Store/LoadingStore';
import OptionsStore from '../../../Store/OptionsStore';
import PermissionStore from '../../../Store/PermissionStore';

const ApprovalPembelian = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const ensureCategories = OptionsStore((s) => s.ensureCategories);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [search, setSearch] = useState({ search: '', status: 'APPROVAL' });
    const [searchBounce] = useDebounce(search, 500);
    const [firstLoading, setFirstLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const [categoryOptions, setCategoryOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const { search: keyword = '', category_id = '', branch_id = '', status = 'APPROVAL' } = params;
            let query = `?page=${page}&limit=${pageSize}&status=${status || 'APPROVAL'}`;
            if (keyword) query += `&search=${keyword}`;
            if (category_id) query += `&category_id=${category_id}`;
            if (branch_id) query += `&branch_id=${branch_id}`;

            const res = await InventoryApis.GetPembelian(query);
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
            const [categoryData, branchData] = await Promise.all([
                ensureCategories(),
                ensureBranches(),
            ]);
            setCategoryOptions(HelperFunctions.formatDropdown(categoryData, 'id', 'category_name', true));
            setBranchOptions(HelperFunctions.formatDropdown(branchData, 'id', 'branch_name', true));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, search);
        }
    }, [searchBounce]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newSearch = { ...search, [name]: value };
        setSearch(newSearch);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paramFetch.data.map(item => item.id);
            setSelectedRows(allIds);
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const updateStatus = async (ids, status, note = null) => {
        setLoading(true);
        try {
            await InventoryApis.updatePembelian({
                status,
                pembelian_ids: ids,
                note,
            });
            setSelectedRows([]);
            handleCloseModal();
            fetchData(paramFetch.current_page, paramFetch.per_page, search);

            showAlert({
                icon: status === 'DISETUJUI' ? 'success' : 'error',
                isAutoClose: true,
                title: status === 'DISETUJUI' ? 'Berhasil Disetujui' : 'Berhasil Ditolak',
                message: status === 'DISETUJUI'
                    ? 'Item pembelian telah masuk ke inventory aktif dan siap digunakan.'
                    : 'Transaksi pembelian telah ditolak dan tidak akan diproses lebih lanjut.',
            });
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Terjadi kesalahan saat memproses data' });
        } finally {
            setLoading(false);
        }
    };

    const confirmApprove = (ids) => {
        showAlert({
            icon: 'success',
            isAutoClose: false,
            title: 'Setujui Pembelian',
            message: 'Anda akan menyetujui item pembelian ini. Item akan masuk ke inventory aktif dan siap digunakan dalam proses operasional.',
            confirmText: 'Setujui',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) {
                updateStatus(ids, 'DISETUJUI');
            }
        });
    };

    const confirmReject = (ids) => {
        showAlert({
            icon: 'error',
            isAutoClose: false,
            title: 'Tolak Pembelian',
            message: 'Anda akan menolak item pembelian ini.',
            textarea: true,
            placeholder: 'Masukkan alasan penolakan',
            confirmText: 'Tolak',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) {
                updateStatus(ids, 'DITOLAK', res.value);
            }
        });
    };

    const handleBulkApprove = () => {
        confirmApprove(selectedRows);
    };

    const handleBulkReject = () => {
        confirmReject(selectedRows);
    };

    const handleOpenModal = (data) => {
        setSelectedData(data);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedData(null);
    };

    const handleApprove = () => {
        if (!selectedData) return;
        confirmApprove([selectedData.id]);
    };

    const handleReject = () => {
        if (!selectedData) return;
        confirmReject([selectedData.id]);
    };

    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === paramFetch.data.length && paramFetch.data.length > 0}
                />
            ),
            accessor: 'checkbox',
            render: (row) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                />
            )
        },
        { header: 'Batch', accessor: 'batch', sortable: true },
        {
            header: 'Kode',
            accessor: 'barcode',
            render: (row) => (
                <span className="px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-xs font-medium text-neutral-700">
                    {row.barcode}
                </span>
            )
        },
        {
            header: 'Produk',
            accessor: 'produk',
            render: (row) => row.product?.product_name ?? '-'
        },
        {
            header: 'Kategori',
            accessor: 'kategori',
            render: (row) => row.category?.category_name ?? '-'
        },
        {
            header: 'Sub Kategori',
            accessor: 'subkategori',
            render: (row) => row.category?.parent_id ? row.category?.category_name : '-'
        },
        {
            header: 'Deskripsi',
            accessor: 'deskripsi',
            render: (row) => row.product?.description ?? '-'
        },
        {
            header: 'Cabang',
            accessor: 'cabang',
            render: (row) => row.branch?.branch_name ?? '-'
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const statusMap = {
                    'APPROVAL': { label: 'Approval', style: 'bg-warning-50 text-warning-700 border-warning-200' },
                    'DISETUJUI': { label: 'Disetujui', style: 'bg-success-50 text-success-700 border-success-200' },
                    'DITOLAK': { label: 'Ditolak', style: 'bg-danger-50 text-danger-700 border-danger-200' },
                    'DIBATALKAN': { label: 'Dibatalkan', style: 'bg-danger-50 text-danger-700 border-danger-200' },
                };
                const status = statusMap[row.status] || { label: row.status, style: 'bg-gray-50 text-gray-700 border-gray-200' };
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${status.style}`}>
                        {status.label}
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
                        onClick={() => handleOpenModal(row)}
                        className="p-1.5 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors cursor-pointer"
                    >
                        <EyeIcon size={18} />
                    </button>
                </div>
            )
        }
    ];

    const statusOptions = [
        { value: 'APPROVAL', label: 'Approval' },
        { value: 'DISETUJUI', label: 'Disetujui' },
        { value: 'DITOLAK', label: 'Ditolak' },
        { value: 'DIBATALKAN', label: 'Dibatalkan' },
    ];

    const searchFilter = [
        { type: 'search', name: 'search', label: '', placeholder: 'Cari produk..' },
    ];

    const dropdownFilters = [
        { type: 'dropdown', name: 'status', label: '', placeholder: 'Pilih status', options: statusOptions },
        { type: 'dropdown', name: 'category_id', label: '', placeholder: 'Pilih kategori', options: categoryOptions },
        { type: 'dropdown', name: 'branch_id', label: '', placeholder: 'Pilih cabang', options: branchOptions },
    ];

    return (
        <div className={`flex flex-col gap-6 relative min-h-full ${selectedRows.length > 0 ? 'pb-24 lg:pb-28' : ''}`}>
            <HeaderSection
                title="Approval Pembelian"
                description="Verifikasi detail item pembelian sebelum menyetujui proses masuknya inventory ke stok aktif."
                icon={CheckSquareOffsetIcon}
            />

            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={searchFilter}
                        formData={search}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
                {dropdownFilters.map((field) => (
                    <div key={field.name} className="w-[160px]">
                        <InputGroup
                            fields={[field]}
                            formData={search}
                            cols="1"
                            onChange={handleFilterChange}
                        />
                    </div>
                ))}
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={(newPage) => fetchData(newPage, paramFetch.per_page, search)}
                onPageSizeChange={(newSize) => fetchData(1, newSize, search)}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={can('update', 'approval.pembelian') ? handleApprove : undefined}
                onSubmitReject={can('update', 'approval.pembelian') ? handleReject : undefined}
                data={selectedData}
                mode="approve"
            />

            <div className="w-3/6 relative z-60">
                <FooterActionBar
                    selectedCount={selectedRows.length}
                    onClearSelection={() => setSelectedRows([])}
                    secondaryText={can('update', 'approval.pembelian') ? "Tolak" : undefined}
                    secondaryType="danger"
                    onSecondaryClick={handleBulkReject}
                    primaryText={can('update', 'approval.pembelian') ? "Setujui" : undefined}
                    primaryType="primary"
                    onPrimaryClick={handleBulkApprove}
                />
            </div>
        </div>
    );
};

export default ApprovalPembelian;
