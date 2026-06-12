import { useState } from 'react';
import { PlusCircleIcon, EyeIcon, PencilSimpleLineIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import Table from "../../components/Table/Table";
import HelperFunctions from "../../utils/HelperFunctions";
import ModalTransaksi from "./Modal";

const TIPE_OPTIONS = ['Cash In', 'Cash Out'];
const CABANG_OPTIONS = ['Blok M', 'H Ten'];

const Finance = () => {
    const [filter, setFilter] = useState({ search: '', tipe: '', cabang: '' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [selectedData, setSelectedData] = useState(null);

    const [paramFetch, setParamFetch] = useState({
        data: [
            { id: 1, tanggal: '08 Jun 2026 08:15', cabang: 'Blok M', tipe: 'Cash In', kategori: 'Operasional', metode_bayar: 'Cash', jumlah: 10000000, keterangan: '-' },
            { id: 2, tanggal: '08 Jun 2026 08:15', cabang: 'H Ten', tipe: 'Cash Out', kategori: 'Modal Masuk', metode_bayar: 'Transfer', jumlah: 10000000, keterangan: 'Hilang menghilang...' },
        ],
        page: 1,
        pageSize: 10,
        total: 15,
    });

    const handleOpenAdd = () => {
        setModalMode('add');
        setSelectedData(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (row) => {
        setModalMode('edit');
        setSelectedData(row);
        setIsModalOpen(true);
    };

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal', sortable: true },
        { header: 'Cabang', accessor: 'cabang', sortable: true },
        {
            header: 'Tipe', accessor: 'tipe', sortable: true,
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${row.tipe === 'Cash In'
                    ? 'bg-success-50 text-success-700 border-success-200'
                    : 'bg-danger-50 text-danger-700 border-danger-200'}`}>
                    {row.tipe}
                </span>
            )
        },
        { header: 'Kategori', accessor: 'kategori' },
        { header: 'Metode Bayar', accessor: 'metode_bayar' },
        { header: 'Jumlah', accessor: 'jumlah', render: (row) => HelperFunctions.formatCurrency(row.jumlah) },
        {
            header: 'Keterangan', accessor: 'keterangan',
            render: (row) => <span className="block max-w-[160px] truncate text-gray-600">{row.keterangan || '-'}</span>
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 text-info-500 hover:bg-info-50 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={18} />
                    </button>
                    <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                        title="Edit"
                    >
                        <PencilSimpleLineIcon size={18} />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Finance"
                description="Kelola data keuangan toko."
                icon={PlusCircleIcon}
                textButton="Tambah Transaksi"
                onClick={handleOpenAdd}
            />

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        placeholder="Cari nama"
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={filter.tipe}
                    onChange={(e) => setFilter({ ...filter, tipe: e.target.value })}
                    className="py-2 px-3 border border-neutral-200 rounded-lg text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-[140px]"
                >
                    <option value="">Semua tipe</option>
                    {TIPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                    value={filter.cabang}
                    onChange={(e) => setFilter({ ...filter, cabang: e.target.value })}
                    className="py-2 px-3 border border-neutral-200 rounded-lg text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-[140px]"
                >
                    <option value="">Semua cabang</option>
                    {CABANG_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.page}
                pageSize={paramFetch.pageSize}
                total={paramFetch.total}
                onPageChange={(page) => setParamFetch(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setParamFetch(prev => ({ ...prev, pageSize, page: 1 }))}
            />

            <ModalTransaksi
                isOpen={isModalOpen}
                mode={modalMode}
                data={selectedData}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Finance;
