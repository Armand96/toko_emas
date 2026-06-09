import { useEffect, useState } from "react";
import { PlusCircleIcon, EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import InputGroup from "../../components/FormElement/InputGroup";
import Table from "../../components/Table/Table";
import LoadingStore from "../../Store/LoadingStore";
import FooterActionBar from "../../components/FooterActionBar";
import ModalViewPenjualan from "./ModalView"; // Pastikan path ini sesuai

const Main = ({ setCurentState }) => {
    const [paramFetch, setParamFetch] = useState({
        data: [
            // Dummy data agar tabel tidak kosong dan bisa ditest
            { id: 1, tanggal: '21 Mei 2026', no_nota: 'ORD-2605015', supplier: '-', cabang: 'Pusat', total_item: 2, total_harga: 39000000, status: 'Menunggu Approval' },
            { id: 2, tanggal: '20 Mei 2026', no_nota: 'ORD-2605014', supplier: '-', cabang: 'Pusat', total_item: 1, total_harga: 5000000, status: 'Selesai' }
        ],
        current_page: 1,
        total: 2,
        per_page: 10,
    });

    const setLoading = LoadingStore((state) => state.setLoading);
    const [selectedRows, setSelectedRows] = useState([]);

    // --- State untuk Modal View ---
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const [search, setSearch] = useState({
        search: '',
        status: null,
        kategori: null,
        cabang: null,
    });

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
        alert(`${selectedRows.length} data berhasil disetujui`); // Diganti alert sementara jika showAlert tidak diimport
        setSelectedRows([]);
    };

    const handleBulkReject = () => {
        alert(`${selectedRows.length} data berhasil ditolak`);
        setSelectedRows([]);
    };

    // --- Fungsi Buka Modal View ---
    const handleViewTransaction = (row) => {
        // Karena data dari tabel (row) biasanya belum lengkap,
        // Anda nantinya perlu melakukan Fetch API detail transaksi di sini berdasarkan row.id

        // Untuk sekarang, kita format dummy data yang struktur objectnya
        // sesuai dengan kebutuhan props 'data' di ModalViewPenjualan
        const detailData = {
            customer: {
                type: "Member Terdaftar",
                id: "MBR-0002",
                nama: "Siti Aminah",
                hp: "082145678901",
                alamat: "Jl. Merdeka Timur No. 24, Cempaka Putih, Jakarta Pusat"
            },
            cart: [
                { id: "GLD0100000", name: "Kalung Italy Rantai", specs: "5g • 18K", price: 19500000, image: "https://via.placeholder.com/40/FDF3E7/D97706?text=K" },
                { id: "GLD0100001", name: "Gelang Flower", specs: "8g • 20K", price: 19500000, image: "https://via.placeholder.com/40/FDF3E7/D97706?text=G" }
            ],
            payment: {
                method: "Transfer",
                subTotal: row.total_harga || 39000000,
                total: row.total_harga || 39000000,
                uangDibayar: 0,
                kembalian: 0,
                bank: "BCA",
                rekeningName: "ABDULLOH ISMAIL",
                rekeningNumber: "122378561274",
                pengirim: "SITI AMINAH"
            },
            meta: {
                orderId: row.no_nota || "ORD-2605015",
                diajukanOleh: "Dianita Admin",
                tanggal: row.tanggal || "21 Mei 2026, 12:00"
            },
            approval: {
                status: row.status || "Menunggu Approval",
                role: "Owner",
                tanggal: row.tanggal || "21 Mei 2026, 12:00"
            }
        };

        setSelectedData(detailData);
        setIsViewModalOpen(true);
    };

    const searchFields = [
        { name: 'search', label: 'Cari Produk', type: 'text' },
        { name: 'status', label: 'Pilih Status', type: 'dropdown', options: [] },
        { name: 'kategori', label: 'Pilih Kategori', type: 'dropdown', options: [] },
        { name: 'cabang', label: 'Pilih Cabang', type: 'dropdown', options: [] }
    ];

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
        { header: 'Tanggal', accessor: 'tanggal' },
        { header: 'Order ID', accessor: 'no_nota' },
        { header: 'Supplier', accessor: 'supplier' },
        { header: 'Cabang', accessor: 'cabang' },
        { header: 'Total Item', accessor: 'total_item' },
        { header: 'Total Harga', accessor: 'total_harga' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const isSelesai = row.status === 'Selesai';
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${isSelesai
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'bg-warning-50 text-warning-700 border-warning-200'
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
                    {/* Event onClick dipasang di sini */}
                    <button
                        onClick={() => handleViewTransaction(row)}
                        className="p-1.5 btn-outline text-info-500 hover:bg-info-50 rounded-md transition-colors"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={20} />
                    </button>
                    <button
                        className="p-1.5 btn-outline !border-primary-500 hover:bg-warning-50 rounded-md transition-colors"
                        title="Edit Data"
                    >
                        <PencilSimpleLineIcon size={20} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6 w-full relative">
            <HeaderSection
                title="Pembelian"
                description="Catat dan kelola pembelian barang sebelum masuk ke inventory aktif."
                icon={PlusCircleIcon}
                onClick={() => setCurentState('form')}
                textButton="Tambah Pembelian"
            />

            <div className="w-full xl:w-4/6">
                <InputGroup
                    fields={searchFields}
                    formData={search}
                    cols='4'
                    onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
                />
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                total={paramFetch.total}
                currentPage={paramFetch.current_page}
                pageSize={paramFetch.per_page}
            />

            {selectedRows.length > 0 && (
                <div className="w-3/6 fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
                    <FooterActionBar
                        selectedCount={selectedRows.length}
                        onClearSelection={() => setSelectedRows([])}
                        secondaryText="Tolak"
                        secondaryType="danger"
                        onSecondaryClick={handleBulkReject}
                        primaryText="Setujui"
                        primaryType="primary"
                        onPrimaryClick={handleBulkApprove}
                    />
                </div>
            )}

            {/* Render Modal View di sini */}
            <ModalViewPenjualan
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                data={selectedData}
            />
        </div>
    );
}

export default Main;
