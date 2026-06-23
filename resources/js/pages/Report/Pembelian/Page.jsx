import { useMemo, useState } from "react";
import {
    PackageIcon,
    ScalesIcon,
    CurrencyCircleDollarIcon,
    ExportIcon,
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import HelperFunctions from "../../../utils/HelperFunctions";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";

/* ──────────────────────────────────────────────────────────
   DUMMY DATA — nanti tinggal diganti hasil API
   ────────────────────────────────────────────────────────── */
const SUMMARY = {
    totalItem: 2000,
    totalBerat: 500,
    totalNilai: 2700000000,
};

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
    { id: 1, tanggal: "2026-05-11", batch: "00005", supplier: "CV. ADI PERKASA", cabang: "Blok M 2", totalItem: 5, totalBerat: 50, totalModal: 60000000 },
    { id: 2, tanggal: "2026-05-11", batch: "00004", supplier: "CV. ADI PERKASA", cabang: "Blok M 1", totalItem: 5, totalBerat: 50, totalModal: 60000000 },
    { id: 3, tanggal: "2026-05-11", batch: "00003", supplier: "CV. ADI PERKASA", cabang: "Blok M 2", totalItem: 5, totalBerat: 50, totalModal: 60000000 },
    { id: 4, tanggal: "2026-05-11", batch: "00002", supplier: "CV. ADI PERKASA", cabang: "Blok M 1", totalItem: 5, totalBerat: 50, totalModal: 60000000 },
    { id: 5, tanggal: "2026-05-11", batch: "00005", supplier: "CV. ADI PERKASA", cabang: "Blok M 2", totalItem: 5, totalBerat: 50, totalModal: 60000000 },
];

const CABANG_OPTIONS = [
    { value: "", label: "Semua Cabang" },
    { value: "blok-m-1", label: "Blok M 1" },
    { value: "blok-m-2", label: "Blok M 2" },
    { value: "blok-m-3", label: "Blok M 3" },
];

const ReportPembelian = () => {
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
            header: "Tanggal", accessor: "tanggal", sortable: true,
            render: (row) => new Date(row.tanggal).toLocaleDateString("id-ID"),
        },
        { header: "Batch", accessor: "batch" },
        { header: "Supplier", accessor: "supplier" },
        { header: "Cabang", accessor: "cabang" },
        { header: "Total Item", accessor: "totalItem" },
        { header: "Total Berat", accessor: "totalBerat", render: (row) => `${row.totalBerat} gr` },
        {
            header: "Total Modal", accessor: "totalModal",
            render: (row) => HelperFunctions.formatCurrency(row.totalModal),
        },
    ];

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Pembelian"
                description="Rekap pembelian yang sudah disetujui — sudah memotong saldo kas dan tercatat sebagai stok inventory."
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
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Total Item Dibeli" value={SUMMARY.totalItem.toLocaleString("id-ID")} icon={PackageIcon} tone="info" />
                <StatCard label="Total Berat" value={`${SUMMARY.totalBerat.toLocaleString("id-ID")} gr`} icon={ScalesIcon} tone="success" />
                <StatCard label="Total Nilai Pembelian" value={HelperFunctions.formatCurrency(SUMMARY.totalNilai)} icon={CurrencyCircleDollarIcon} tone="warning" />
            </div>

            {/* Per Kategori/Sub Kategori + Per Karat */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Pembelian per Kategori" subtitle="Distribusi pembelian berdasarkan kategori produk.">
                        <BarChartH data={PER_KATEGORI} height={180} />
                    </ChartCard>
                    <ChartCard title="Pembelian per Sub Kategori" subtitle="Distribusi pembelian berdasarkan sub kategori produk.">
                        <BarChartH data={PER_SUB_KATEGORI} height={180} />
                    </ChartCard>
                </div>
                <ChartCard title="Pembelian per Karat" subtitle="Distribusi pembelian berdasarkan karat emas.">
                    <BarChartH data={PER_KARAT} height={400} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="mx-4 rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-950">Detail Pembelian</h3>
                        <p className="text-[13px] text-gray-500">Ringkasan pembelian inventory per batch.</p>
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

export default ReportPembelian;
