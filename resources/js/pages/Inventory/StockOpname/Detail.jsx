import { useState } from 'react';
import StatCards from "./StatCards";

const DUMMY_SESUAI = [
    { kode: 'CIN-000006-001', produk: 'Cincin Flower', kategori: 'Cincin', berat: '5.20g', karat: '22K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'Kalung Italy Rantai', kategori: 'Kalung', berat: '8.50g', karat: '18K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'ANTAM', kategori: 'Logam Mulia', berat: '10g', karat: '24K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'Anting Mutiara', kategori: 'Anting', berat: '5g', karat: '22K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'Cincin Clover', kategori: 'Cincin', berat: '2g', karat: '18K', status: 'Available' },
];

const DUMMY_LOST = [
    { kode: 'CIN-000006-001', produk: 'Cincin Flower', kategori: 'Cincin', berat: '5.20g', karat: '22K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'Kalung Italy Rantai', kategori: 'Kalung', berat: '8.50g', karat: '18K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'ANTAM', kategori: 'Logam Mulia', berat: '10g', karat: '24K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'Anting Mutiara', kategori: 'Anting', berat: '5g', karat: '22K', status: 'Available' },
    { kode: 'CIN-000006-001', produk: 'Cincin Clover', kategori: 'Cincin', berat: '2g', karat: '18K', status: 'Available' },
];

const DUMMY_EXTRA = [
    { kode: 'CIN-000006-001', catatan: 'Barcode tidak ditemukan di sistem atau di cabang ini.', waktu: '11/05/2026 09:10' },
    { kode: 'CIN-000006-001', catatan: 'Barcode tidak ditemukan di sistem atau di cabang ini.', waktu: '11/05/2026 09:09' },
    { kode: 'CIN-000006-001', catatan: 'Barcode tidak ditemukan di sistem atau di cabang ini.', waktu: '11/05/2026 09:08' },
];

const ItemTable = ({ rows }) => (
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
                {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                            <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded text-xs font-medium border border-gray-200">{row.kode}</span>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 rounded-md border border-gray-100 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-800">{row.produk}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.kategori}</td>
                        <td className="px-4 py-3 text-gray-600">{row.berat}</td>
                        <td className="px-4 py-3 text-gray-600">{row.karat}</td>
                        <td className="px-4 py-3">
                            <span className="px-3 py-1 rounded-md text-xs font-medium border bg-success-50 text-success-700 border-success-200">{row.status}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const Detail = ({ setCurentState }) => {
    const [activeTab, setActiveTab] = useState('sesuai');

    const stats = [
        { label: 'Total Item Aktif di System', value: 500 },
        { label: 'Sudah Scan/Input', value: 495 },
        { label: 'Lost Item', value: 5 },
        { label: 'Extra Item', value: 3 },
    ];

    const tabs = [
        { id: 'sesuai', label: `Sesuai (${DUMMY_SESUAI.length})` },
        { id: 'lost', label: `Lost (${DUMMY_LOST.length})` },
        { id: 'extra', label: `Extra (${DUMMY_EXTRA.length})` },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6 min-h-screen">
            <div className="flex flex-col gap-0.5 p-4">
                <span className="text-[24px] font-semibold text-gray-950">Stock Opname Item</span>
                <span className="text-[13px] text-gray-500">Lorem ipsum dolor sit amet</span>
            </div>

            <StatCards stats={stats} />

            {/* SESI SELESAI */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold text-gray-900">Sesi Selesai: OPN-2026-05-JKT</h2>
                    <span className="text-sm text-gray-500">Toko Blok M 1 · 11 Mei 2026 09:00 sd 11 Mei 2026 12:00</span>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-500">495 / 500 item</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: '99%' }} />
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

                {activeTab === 'sesuai' && <ItemTable rows={DUMMY_SESUAI} />}
                {activeTab === 'lost' && <ItemTable rows={DUMMY_LOST} />}
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
                                {DUMMY_EXTRA.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded text-xs font-medium border border-gray-200">{row.kode}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.catatan}</td>
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
                    onClick={() => setCurentState('main')}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
};

export default Detail;
