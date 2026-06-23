import { useMemo, useState } from "react";
import {
    ReceiptIcon,
    ChatTextIcon,
    TrendUpIcon,
    ScalesIcon,
    ExportIcon,
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import HelperFunctions from "../../../utils/HelperFunctions";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";
import LineChart from "./Component/LineChart";

/* ──────────────────────────────────────────────────────────
   DUMMY DATA — nanti tinggal diganti hasil API
   ────────────────────────────────────────────────────────── */
const SUMMARY = {
    total: 380260000,
    transaksi: 18,
    laba: 18260000,
    emas: 900,
};

const TREN = [
    { label: "01", value: 45000000 },
    { label: "02", value: 55000000 },
    { label: "03", value: 31000000 },
    { label: "04", value: 75000000 },
    { label: "05", value: 22000000 },
    { label: "06", value: 60000000 },
    { label: "07", value: 62000000 },
];

const TOP_PRODUK = [
    { id: 1, nama: "Kalung Italy Rantai", karat: "24K", berat: "12.1 gr", terjual: 160 },
    { id: 2, nama: "Kalung Italy Rantai", karat: "24K", berat: "12.1 gr", terjual: 159 },
    { id: 3, nama: "Kalung Italy Rantai", karat: "24K", berat: "12.1 gr", terjual: 150 },
    { id: 4, nama: "Kalung Italy Rantai", karat: "24K", berat: "12.1 gr", terjual: 140 },
    { id: 5, nama: "Kalung Italy Rantai", karat: "24K", berat: "12.1 gr", terjual: 100 },
];

const PER_KATEGORI = [
    { label: "Perhiasan", value: 29000000 },
    { label: "Logam Mulia", value: 23000000 },
    { label: "Silver", value: 9000000 },
    { label: "Berlian", value: 14000000 },
    { label: "Cukim", value: 6000000 },
];

const PER_SUB_KATEGORI = [
    { label: "Cincin", value: 29000000 },
    { label: "Anting", value: 22000000 },
    { label: "Kalung", value: 8000000 },
    { label: "Gelang", value: 15000000 },
    { label: "Liontin", value: 4000000 },
];

const PER_KARAT = [
    { label: "24K", value: 30000000 },
    { label: "23K", value: 29000000 },
    { label: "22K", value: 7000000 },
    { label: "21K", value: 16000000 },
    { label: "20K", value: 13000000 },
    { label: "18K", value: 9000000 },
    { label: "17K", value: 8000000 },
    { label: "16K", value: 7000000 },
    { label: "14K", value: 9000000 },
    { label: "10K", value: 6000000 },
    { label: "9K", value: 5000000 },
    { label: "8K", value: 4000000 },
    { label: "6K", value: 5000000 },
];

const DETAIL = [
    { id: 1, tanggal: "2026-05-11", orderId: "ORD-2605015", customer: "Siti Rahmawat", item: "Kalung Italy, Cincin..", berat: 50, nominal: 60000000, pembayaran: "Tunai", cabang: "BLOK M 1", user: "YanuarKasir Pratama" },
    { id: 2, tanggal: "2026-05-11", orderId: "ORD-2605015", customer: "Siti Rahmawat", item: "Kalung Italy, Cincin..", berat: 50, nominal: 60000000, pembayaran: "Transfer", cabang: "BLOK M 1", user: "IndahKasir2" },
];

const CABANG_OPTIONS = [
    { value: "", label: "Semua Cabang" },
    { value: "blok-m-1", label: "Blok M 1" },
    { value: "blok-m-2", label: "Blok M 2" },
    { value: "blok-m-3", label: "Blok M 3" },
];

const ReportPenjualan = () => {
    const [filter, setFilter] = useState({
        dateRange: { mode: "range", start: "2026-06-01", end: "2026-06-15" },
        cabang: "",
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    const pagedDetail = useMemo(() => {
        const start = (page - 1) * pageSize;
        return DETAIL.slice(start, start + pageSize);
    }, [page, pageSize]);

    const detailColumns = [
        {
            header: "Tanggal", accessor: "tanggal",
            render: (row) => new Date(row.tanggal).toLocaleDateString("id-ID"),
        },
        { header: "Order ID", accessor: "orderId" },
        { header: "Customer", accessor: "customer" },
        { header: "Item Produk", accessor: "item" },
        { header: "Total Berat", accessor: "berat", render: (row) => `${row.berat} gr` },
        {
            header: "Nominal", accessor: "nominal",
            render: (row) => HelperFunctions.formatCurrency(row.nominal),
        },
        {
            header: "Pembayaran", accessor: "pembayaran",
            render: (row) => (
                <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${row.pembayaran === "Tunai"
                    ? "border-success-200 bg-success-50 text-success-700"
                    : "border-info-200 bg-info-50 text-info-700"}`}>
                    {row.pembayaran}
                </span>
            ),
        },
        { header: "Cabang", accessor: "cabang" },
        { header: "User", accessor: "user" },
    ];

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Penjualan"
                description="Analisis penjualan, produk terlaris, dan performa toko untuk mendukung pengambilan keputusan."
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-start gap-3 px-4">
                <div className="w-full sm:w-[260px]">
                    <InputGroup
                        fields={[{ name: "dateRange", label: "", type: "daterange" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
                <div className="w-full sm:w-[180px]">
                    <InputGroup
                        fields={[{ name: "cabang", label: "", type: "dropdown", options: CABANG_OPTIONS, placeholder: "Pilih cabang" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Penjualan" value={HelperFunctions.formatCurrency(SUMMARY.total)} icon={ReceiptIcon} tone="info" />
                <StatCard label="Jumlah Transaksi" value={SUMMARY.transaksi.toLocaleString("id-ID")} icon={ChatTextIcon} tone="danger" />
                <StatCard label="Laba" value={HelperFunctions.formatCurrency(SUMMARY.laba)} icon={TrendUpIcon} tone="success" />
                <StatCard label="Emas Terjual" value={`${SUMMARY.emas.toLocaleString("id-ID")}gr`} icon={ScalesIcon} tone="warning" />
            </div>

            {/* Tren + Produk Terlaris */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <ChartCard title="Tren Penjualan" subtitle="Perkembangan omzet penjualan harian">
                    <LineChart data={TREN} />
                </ChartCard>

                <ChartCard title="Produk Terlaris" subtitle="Top 5 berdasarkan omzet berjalan">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                                    <th className="py-2.5 pr-2 font-medium">No</th>
                                    <th className="py-2.5 pr-2 font-medium">Produk</th>
                                    <th className="py-2.5 pr-2 font-medium">Karat</th>
                                    <th className="py-2.5 pr-2 font-medium">Berat</th>
                                    <th className="py-2.5 font-medium">Terjual</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TOP_PRODUK.map((p, i) => (
                                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                                        <td className="py-3 pr-2">
                                            {i < 3 ? (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-neutral-white">
                                                    {i + 1}
                                                </span>
                                            ) : (
                                                <span className="pl-2 text-gray-500">{i + 1}</span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-2 text-gray-900">{p.nama}</td>
                                        <td className="py-3 pr-2 text-gray-700">{p.karat}</td>
                                        <td className="py-3 pr-2 text-gray-700">{p.berat}</td>
                                        <td className="py-3 font-medium text-gray-900">{p.terjual}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>

            {/* Per Kategori/Sub Kategori + Per Karat */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Penjualan per Kategori" subtitle="Distribusi penjualan berdasarkan kategori produk.">
                        <BarChartH data={PER_KATEGORI} height={180} />
                    </ChartCard>
                    <ChartCard title="Penjualan per Sub Kategori" subtitle="Distribusi penjualan berdasarkan sub kategori produk.">
                        <BarChartH data={PER_SUB_KATEGORI} height={180} />
                    </ChartCard>
                </div>
                <ChartCard title="Penjualan per Karat" subtitle="Distribusi penjualan berdasarkan karat emas.">
                    <BarChartH data={PER_KARAT} height={400} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="mx-4 rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-950">Detail Penjualan</h3>
                        <p className="text-[13px] text-gray-500">Pantau seluruh aktivitas penjualan emas secara real-time.</p>
                    </div>
                    <button
                        type="button"
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                    >
                        <ExportIcon size={18} /> Export Data
                    </button>
                </div>

                <Table
                    columns={detailColumns}
                    data={pagedDetail}
                    page={page}
                    pageSize={pageSize}
                    total={DETAIL.length}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                />
            </div>
        </div>
    );
};

export default ReportPenjualan;
