import { useState } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    SortAscendingIcon,
    EyeIcon,
    XIcon,
    CheckSquareOffsetIcon,
    CheckIcon
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import Modal from "./Modal";
import { showAlert } from '../../../utils/showAlert';
import InputGroup from '../../../components/FormElement/InputGroup';
import FooterActionBar from '../../../components/FooterActionBar';

const ApprovalPembelian = () => {
    const [paramFetch, setParamFetch] = useState({
        data: [
            { id: 1, batch: 'BCH-001', kategori: 'CINCIN', cabang: 'Promas Pusat', pic: 'Budi Santoso', tanggal_transaksi: '2026-06-01', harga_beli: 15000000, status: 'Menunggu' },
            { id: 2, batch: 'BCH-002', kategori: 'KALUNG', cabang: 'Promas Jakarta', pic: 'Andi Wijaya', tanggal_transaksi: '2026-06-02', harga_beli: 25000000, status: 'Disetujui' },
            { id: 3, batch: 'BCH-003', kategori: 'GELANG', cabang: 'Promas Bandung', pic: 'Siti Rahma', tanggal_transaksi: '2026-06-03', harga_beli: 10000000, status: 'Ditolak' }
        ],
        page: 1,
        total: 3,
        per_page: 10,
    });

    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
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

    const handleBulkApprove = () => {
        showAlert('success', 'Berhasil', `${selectedRows.length} data pembelian berhasil disetujui`);
        setSelectedRows([]);
    };

    const handleBulkReject = () => {
        showAlert('success', 'Berhasil', `${selectedRows.length} data pembelian berhasil ditolak`);
        setSelectedRows([]);
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
        showAlert('success', 'Berhasil', 'Pembelian barang berhasil disetujui');
        handleCloseModal();
    };

    const handleReject = () => {
        showAlert('success', 'Berhasil', 'Pembelian barang berhasil ditolak');
        handleCloseModal();
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
        { header: 'Kategori', accessor: 'kategori', sortable: true },
        { header: 'Cabang', accessor: 'cabang', sortable: true },
        { header: 'PIC', accessor: 'pic', sortable: true },
        { header: 'Tanggal Transaksi', accessor: 'tanggal_transaksi', sortable: true },
        {
            header: 'Harga Beli',
            accessor: 'harga_beli',
            sortable: true,
            render: (row) => formatRupiah(row.harga_beli)
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const status = row.status.toLowerCase();
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${status === 'menunggu'
                            ? 'bg-warning-50 text-warning-700 border-warning-200'
                            : status === 'disetujui'
                                ? 'bg-success-50 text-success-700 border-success-200'
                                : 'bg-danger-50 text-danger-700 border-danger-200'
                        }`}>
                        {row.status}
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

    const formSearch = [
        {
            type: 'search',
            label: 'Cari Produk',
        }
    ];

    return (
        <div className={`flex flex-col gap-6 relative min-h-full ${selectedRows.length > 0 ? 'pb-24 lg:pb-28' : ''}`}>
            <HeaderSection
                title="Approval Pembelian"
                description="Approval Pembelian Barang Masuk"
                icon={CheckSquareOffsetIcon}
            />

            <div className="w-2/3">
                <InputGroup fields={formSearch} cols="4" />
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.page}
                pageSize={paramFetch.pageSize}
                totalData={paramFetch.total}
                onPageChange={(newPage) => setParamFetch(prev => ({ ...prev, page: newPage }))}
                onPageSizeChange={(newSize) => setParamFetch(prev => ({ ...prev, pageSize: newSize, page: 1 }))}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={handleApprove}
                onSubmitReject={handleReject}
                data={selectedData}
            />

            <div className="w-3/6 relative z-60">
                  <FooterActionBar
                selectedCount={selectedRows.length}
                onClearSelection={() => setSelectedRows([])}
                secondaryText="Tolak"
                secondaryType="danger"
                // secondaryIcon={<XIcon size={16} weight="bold" />}
                onSecondaryClick={handleBulkReject}
                primaryText="Setujui"
                primaryType="primary"
                // primaryIcon={<CheckIcon size={16} weight="bold" />}
                onPrimaryClick={handleBulkApprove}
            />
            </div>
        </div>
    );
};

export default ApprovalPembelian;
