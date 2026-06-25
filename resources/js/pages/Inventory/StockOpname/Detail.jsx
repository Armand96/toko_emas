import { useState, useEffect } from 'react';
import { PackageIcon, CheckCircleIcon, WarningCircleIcon, PlusCircleIcon } from "@phosphor-icons/react";
import StatCards from "./StatCards";
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from "../../../utils/HelperFunctions";
import CodeBadge from "../../../components/CodeBadge";
import Badge from "../../../components/Badge";

const ItemTable = ({ rows, lost = false }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-900">
            <thead className="text-xs text-gray-600 border-b border-gray-200">
                <tr>
                    <th className="px-4 py-3 font-semibold">Kode</th>
                    <th className="px-4 py-3 font-semibold">Produk</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Berat</th>
                    <th className="px-4 py-3 font-semibold">Karat</th>
                    <th className="px-4 py-3 font-semibold">Status Terakhir</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada item.</td></tr>
                ) : rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                            <CodeBadge>{row.kode}</CodeBadge>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 rounded-md border border-gray-100 flex-shrink-0 overflow-hidden">
                                    {row.image && <img src={row.image} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <span className="text-sm font-medium text-gray-800">{row.produk}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.kategori}</td>
                        <td className="px-4 py-3 text-gray-600">{row.berat}</td>
                        <td className="px-4 py-3 text-gray-600">{row.karat}</td>
                        <td className="px-4 py-3">
                            <Badge tone={lost ? 'danger' : 'success'}>
                                {row.last_status}
                            </Badge>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const Detail = ({ id, setCurentState }) => {
    const [activeTab, setActiveTab] = useState('sesuai');
    const [isLoading, setIsLoading] = useState(true);
    const [header, setHeader] = useState(null);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        InventoryApis.GetStockOpnameSingle(id)
            .then((res) => setHeader(res?.data || null))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);

    const details = header?.details || [];

    const mapDetail = (d) => {
        const inv = d.inventory || {};
        return {
            kode: d.inventory_code,
            image: inv.image_path ? HelperFunctions.getStorageUrl(inv.image_path) : null,
            produk: d.product?.product_name || d.product?.name || '-',
            kategori: inv.category?.category_name || inv.category?.name || '-',
            berat: inv.berat ? `${inv.berat}g` : '-',
            karat: inv.karat ? `${inv.karat}K` : '-',
            last_status: d.last_status,
            opname_status: d.opname_status,
            note: d.note,
            waktu: d.created_at
                ? new Date(d.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '-',
        };
    };

    const allRows = details.map(mapDetail);
    const sesuaiRows = allRows.filter((r) => r.opname_status === 'INSTOCK');
    const lostRows = allRows.filter((r) => r.opname_status === 'MISSING');
    const extraRows = allRows.filter((r) => r.opname_status === 'EXTRA');

    const totalItem = header?.total_item ?? 0;
    const scanned = (header?.in_stock ?? 0) + (header?.extra ?? 0);
    const progress = totalItem > 0 ? Math.min(100, Math.round(((header?.in_stock ?? 0) / totalItem) * 100)) : 0;

    const stats = [
        { label: 'Total Item Aktif di System', value: totalItem, icon: PackageIcon, iconBg: 'bg-primary-50', iconColor: 'text-primary-500' },
        { label: 'Sudah Scan/Input', value: scanned, icon: CheckCircleIcon, iconBg: 'bg-success-50', iconColor: 'text-success-600' },
        { label: 'Lost Item', value: header?.missing ?? 0, icon: WarningCircleIcon, iconBg: 'bg-danger-50', iconColor: 'text-danger-600' },
        { label: 'Extra Item', value: header?.extra ?? 0, icon: PlusCircleIcon, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' },
    ];

    const tabs = [
        { id: 'sesuai', label: `Sesuai (${sesuaiRows.length})` },
        { id: 'lost', label: `Lost (${lostRows.length})` },
        { id: 'extra', label: `Extra (${extraRows.length})` },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6 min-h-screen">
            <div className="flex flex-col gap-0.5 p-4">
                <span className="text-[24px] font-semibold text-gray-950">Stock Opname Item</span>
                <span className="text-[13px] text-gray-500">Detail hasil pengecekan stok fisik terhadap data inventory sistem.</span>
            </div>

            <StatCards stats={stats} />

            {/* SESI SELESAI */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isLoading ? 'Memuat...' : `Sesi: ${header?.kode_sesi || '-'}`}
                    </h2>
                    <span className="text-sm text-gray-500">
                        {header?.branch?.branch_name || '-'}
                        {header?.created_at ? ` · ${new Date(header.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-500">{header?.in_stock ?? 0} / {totalItem} item</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            {/* HASIL VERIFIKASI */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold text-gray-900">Hasil Verifikasi</h2>
                    <span className="text-sm text-gray-500">Hasil pencocokan item hasil scan dengan data inventory sistem.</span>
                </div>

                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 w-fit border border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'sesuai' && <ItemTable rows={sesuaiRows} />}
                {activeTab === 'lost' && <ItemTable rows={lostRows} lost />}
                {activeTab === 'extra' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-900">
                            <thead className="text-xs text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Kode</th>
                                    <th className="px-4 py-3 font-semibold">Catatan</th>
                                    <th className="px-4 py-3 font-semibold">Waktu Opname</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extraRows.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Tidak ada item extra.</td></tr>
                                ) : extraRows.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <CodeBadge>{row.kode}</CodeBadge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.note || 'Barcode tidak ditemukan di sistem atau di cabang ini.'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.waktu}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-start mb-8">
                <button
                    type="button"
                    onClick={() => setCurentState({ view: 'main' })}
                    className="btn-outline px-6 py-2.5 rounded-lg font-medium text-sm"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
};

export default Detail;
