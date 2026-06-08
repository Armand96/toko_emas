import { useEffect, useState } from "react";
import { PlusCircle, Eye, X, Printer } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import InputGroup from "../../../components/FormElement/InputGroup";
import Table from "../../../components/Table/Table";
import LoadingStore from "../../../Store/LoadingStore";

const Main = ({ setCurentState }) => {
    const [paramFetch, setParamFetch] = useState({
        data: [{}],
        current_page: 1,
        total: 15,
        per_page: 10,
    });

    const setLoading = LoadingStore((state) => state.setLoading);

    const [search, setSearch] = useState({
        search: '',
        status: null,
    });

    // Filter yang disesuaikan dengan gambar
    const searchFields = [
        { name: 'search', label: '', placeholder: 'Cari transaksi..', type: 'text' },
        { name: 'status', label: '', placeholder: 'Pilih status', type: 'dropdown', options: [] }
    ];

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal' },
        { header: 'Order ID', accessor: 'order_id' },
        { header: 'Customer', accessor: 'customer' },
        { header: 'Item Produk', accessor: 'item_produk' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = '';
                // Menentukan warna badge berdasarkan status
                switch (row.status) {
                    case 'Selesai':
                        badgeClass = 'bg-success-50 text-success-700 border-success-200';
                        break;
                    case 'Approval':
                        badgeClass = 'bg-warning-50 text-warning-700 border-warning-200';
                        break;
                    case 'Ditolak':
                        badgeClass = 'bg-error-50 text-error-700 border-error-200'; // Asumsi class error untuk merah
                        break;
                    case 'Cetak Kwitansi':
                        badgeClass = 'bg-info-50 text-info-700 border-info-200';
                        break;
                    default:
                        badgeClass = 'bg-gray-50 text-gray-700 border-gray-200';
                }

                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${badgeClass}`}>
                        {row.status}
                    </span>
                );
            }
        },
        { header: 'Nominal', accessor: 'nominal' },
        { header: 'Pembayaran', accessor: 'pembayaran' },
        { header: 'User', accessor: 'user' },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    {/* Render tombol X (Reject/Cancel) untuk status tertentu */}
                    {(row.status === 'Cetak Kwitansi' || row.status === 'Approval') && (
                        <button className="p-1.5 btn-outline border border-error-200 text-error-500 hover:bg-error-50 rounded-md transition-colors">
                            <X size={20} />
                        </button>
                    )}

                    {/* Tombol View selalu ada */}
                    <button className="p-1.5 btn-outline border border-info-200 text-info-500 hover:bg-info-50 rounded-md transition-colors">
                        <Eye size={20} />
                    </button>

                    {/* Render tombol Print khusus status Cetak Kwitansi */}
                    {row.status === 'Cetak Kwitansi' && (
                        <button className="p-1.5 btn-outline border border-primary-500 text-primary-500 hover:bg-primary-50 rounded-md transition-colors">
                            <Printer size={20} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Transaksi"
                description="Manage and track all customer orders."
                icon={PlusCircle}
                onClick={() => setCurentState('form')}
                textButton="Transaksi Baru"
            />

            <div className="w-full xl:w-2/6"> {/* Dibuat lebih kecil menyesuaikan porsi 2 field di gambar */}
                <InputGroup
                    fields={searchFields}
                    formData={search}
                    cols='2' // Mengubah layout jadi 2 kolom (Cari & Status)
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
        </div>
    );
}

export default Main;
