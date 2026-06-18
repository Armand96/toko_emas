import { useMemo, useState } from 'react';
import { EyeIcon, CheckSquareOffsetIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import ModalDetailTransfer from "./Modal";
import { showAlert } from '../../../utils/showAlert';

const STATUS_OPTIONS = ['Approval', 'Disetujui', 'Ditolak', 'Dibatalkan'];

const STATUS_STYLE = {
    'Approval': 'bg-warning-50 text-warning-600 border-warning-200',
    'Disetujui': 'bg-success-50 text-success-700 border-success-200',
    'Ditolak': 'bg-danger-50 text-danger-600 border-danger-200',
    'Dibatalkan': 'bg-danger-50 text-danger-600 border-danger-200',
};

const DUMMY_DATA = [
    { id: 1, tanggal: '10/10/2025', kode: 'TRF-2605015', item_produk: 'Cincin Flower 5gr 20K, Cincin Flower 2gr 20K, Ci...', cabang_asal: 'BLOK M 1', cabang_tujuan: 'BLOK M 2', status: 'Approval' },
    { id: 2, tanggal: '10/10/2025', kode: 'TRF-2605014', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 1', cabang_tujuan: 'BLOK M 1', status: 'Approval' },
    { id: 3, tanggal: '10/10/2025', kode: 'TRF-2605013', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 2', cabang_tujuan: 'BLOK M 1', status: 'Disetujui' },
    { id: 4, tanggal: '10/10/2025', kode: 'TRF-2605012', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 2', cabang_tujuan: 'BLOK M 1', status: 'Ditolak' },
];

const ApprovalTransfer = () => {
    const [filter, setFilter] = useState({ search: '', status: '' });
    const [page, setPage] = useState(1);
    const perPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const handleOpenModal = (row) => {
        setSelectedData({
            ...row,
            diajukan_oleh: 'Dianita Admin',
            pic_approval: 'Owner',
            tanggal_pengajuan: '21 Mei 2026, 12:00',
            tanggal_approval: '21 Mei 2026, 12:00',
            catatan: 'Pindah tempat',
            alasan: row.status === 'Ditolak'
                ? 'Karat tidak sesuai dengan dokumen pembelian. Mohon periksa kembali karat pada item.'
                : row.status === 'Dibatalkan'
                ? 'Salah input.'
                : null,
            items: [
                { kode: 'GLD0100000', image: null, nama: 'Kalung Italy Rantai', berat: '5g', karat: '18K', harga_jual: 19500000 },
                { kode: 'GLD0100000', image: null, nama: 'Gelang Flower', berat: '8g', karat: '20K', harga_jual: 19500000 },
            ],
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedData(null);
    };

    const handleResetFilter = () => setFilter({ search: '', status: '' });
    const hasActiveFilter = filter.search || filter.status;

    const filteredData = useMemo(() => {
        return DUMMY_DATA.filter((row) => {
            const matchSearch = !filter.search
                || row.kode.toLowerCase().includes(filter.search.toLowerCase())
                || row.item_produk.toLowerCase().includes(filter.search.toLowerCase());
            const matchStatus = !filter.status || row.status === filter.status;
            return matchSearch && matchStatus;
        });
    }, [filter]);

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal', sortable: true },
        { header: 'Kode', accessor: 'kode', sortable: true },
        { header: 'Item Produk', accessor: 'item_produk' },
        { header: 'Cabang Asal', accessor: 'cabang_asal', sortable: true },
        { header: 'Cabang Tujuan', accessor: 'cabang_tujuan', sortable: true },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${STATUS_STYLE[row.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
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
                    title="Lihat Detail"
                >
                    <EyeIcon size={18} />
                </button>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <HeaderSection
                title="Approval Transfer Item"
                description="Verifikasi detail item dan tujuan cabang sebelum menyetujui proses transfer inventory."
                icon={CheckSquareOffsetIcon}
            />

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        placeholder="Cari transaksi.."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="py-2 px-3 border border-neutral-200 rounded-lg text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-[140px]"
                >
                    <option value="">Approval</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {hasActiveFilter && (
                    <button
                        onClick={handleResetFilter}
                        className="flex items-center gap-1 py-2 px-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Reset <XIcon size={16} weight="bold" />
                    </button>
                )}
            </div>

            <Table
                columns={columns}
                data={filteredData}
                page={page}
                pageSize={perPage}
                totalData={filteredData.length}
                onPageChange={setPage}
            />

            <ModalDetailTransfer
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={() => { showAlert({ icon: 'success', title: 'Berhasil', message: 'Transfer disetujui' }); handleCloseModal(); }}
                onSubmitReject={() => { showAlert({ icon: 'success', title: 'Berhasil', message: 'Transfer ditolak' }); handleCloseModal(); }}
                data={selectedData}
            />
        </div>
    );
};

export default ApprovalTransfer;
