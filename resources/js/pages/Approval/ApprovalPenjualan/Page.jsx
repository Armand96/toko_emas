import { useState } from 'react';
import { EyeIcon, CheckSquareOffsetIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import ModalDetailPenjualan from "./Modal";
import { showAlert } from '../../../utils/showAlert';

const ApprovalPenjualan = () => {
    const [paramFetch, setParamFetch] = useState({
        data: [
            { id: 1, tanggal: '10/10/2025', order_id: 'ORD-2605015', customer: { nama: 'Sofia Martinez' }, item_produk: 'Cincin Flower 5gr', nominal: 18000000, pembayaran: 'Tunai', status: 'Approval' }
        ],
        page: 1,
        total: 15,
        per_page: 10,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const handleOpenModal = (data) => {
        setSelectedData(data);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedData(null);
    };

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal', sortable: true },
        { header: 'Order ID', accessor: 'order_id', sortable: true },
        { header: 'Customer', accessor: (row) => row.customer.nama, sortable: true },
        { header: 'Nominal', accessor: 'nominal', render: (row) => formatRupiah(row.nominal) },
        { header: 'Pembayaran', accessor: 'pembayaran', sortable: true },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-warning-50 text-warning-600 border-warning-200">
                    {row.status}
                </span>
            )
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <button
                    onClick={() => handleOpenModal(row)}
                    className="p-1.5 bg-white border border-neutral-200 text-primary-600 rounded-md hover:bg-neutral-50 transition-colors"
                >
                    <EyeIcon size={18} />
                </button>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <HeaderSection
                title="Approval Penjualan"
                description="Verifikasi detail transaksi penjualan sebelum menyetujui proses transaksi."
                icon={CheckSquareOffsetIcon}
            />

            <div className="flex items-center gap-3 w-full lg:w-2/3">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari transaksi.."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.page}
                pageSize={paramFetch.per_page}
                totalData={paramFetch.total}
                onPageChange={(newPage) => setParamFetch(prev => ({ ...prev, page: newPage }))}
            />

            <ModalDetailPenjualan
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={() => { showAlert('success', 'Berhasil', 'Disetujui'); handleCloseModal(); }}
                onSubmitReject={() => { showAlert('success', 'Berhasil', 'Ditolak'); handleCloseModal(); }}
                data={selectedData}
            />
        </div>
    );
};

export default ApprovalPenjualan;
