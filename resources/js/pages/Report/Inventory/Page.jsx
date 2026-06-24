import { useMemo, useState } from "react";
import {
    CubeIcon,
    ScalesIcon,
    CoinsIcon,
    TrendUpIcon,
    ExportIcon,
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import Badge from "../../../components/Badge";
import CodeBadge from "../../../components/CodeBadge";
import HelperFunctions from "../../../utils/HelperFunctions";
import StatCard from "./Component/StatCard";
import MiniStatCard from "./Component/MiniStatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";
import DonutChart from "./Component/DonutChart";

/* ──────────────────────────────────────────────────────────
   DUMMY DATA — nanti tinggal diganti hasil API
   ────────────────────────────────────────────────────────── */
const SUMMARY = {
    totalItem: 6000,
    totalBerat: 900,
    nilaiModal: 4500000000,
    nilaiJual: 7260000000,
    margin: 2760000000,
    marginPct: 61.3,
};

const STATUS_SECONDARY = [
    { key: "in-repair", label: "Item In Repair", value: 5, tone: "primary" },
    { key: "transit", label: "Item Transit", value: 10, tone: "warning" },
    { key: "lost", label: "Item Lost", value: 18, tone: "danger" },
    { key: "sold", label: "Item Sold", value: 3905, tone: "gray" },
];

const PER_KATEGORI = [
    { label: "Cukim", value: 200 },
    { label: "Berlian", value: 620 },
    { label: "Silver", value: 400 },
    { label: "Logam Mulia", value: 1300 },
    { label: "Perhiasan", value: 1450 },
];

const PER_SUB_KATEGORI = [
    { label: "Liontin", value: 120 },
    { label: "Gelang", value: 560 },
    { label: "Kalung", value: 340 },
    { label: "Anting", value: 1200 },
    { label: "Cincin", value: 1350 },
];

const PER_KARAT = [
    { label: "24K", value: 1280 },
    { label: "23K", value: 1150 },
    { label: "22K", value: 300 },
    { label: "21K", value: 560 },
    { label: "20K", value: 470 },
    { label: "18K", value: 380 },
    { label: "17K", value: 320 },
    { label: "16K", value: 300 },
    { label: "14K", value: 410 },
    { label: "10K", value: 300 },
    { label: "9K", value: 250 },
    { label: "8K", value: 180 },
    { label: "6K", value: 240 },
];

const STATUS_INVENTORY = [
    { label: "Available", value: 6000 },
    { label: "In Repair", value: 5 },
    { label: "Transit", value: 10 },
    { label: "Lost", value: 18 },
    { label: "Sold", value: 3905 },
];

const INVENTORY_AGING = [
    { label: ">180 Hari", value: 620 },
    { label: "91-180 Hari", value: 360 },
    { label: "31-90 Hari", value: 1280 },
    { label: "0-30 Hari", value: 1450 },
];

const DETAIL = [
    { id: 1, kode: "CIN-000006-002", produk: "Cincin Flower", kategori: "Perhiasan", subKategori: "Cincin", berat: 5, karat: "22 K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", aging: 9, status: "Available" },
    { id: 2, kode: "KAL-000006-001", produk: "Kalung Italy Rantai", kategori: "Perhiasan", subKategori: "Kalung", berat: 8.5, karat: "22 K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", aging: 10, status: "Available" },
    { id: 3, kode: "KAL-000006-001", produk: "ANTAM", kategori: "Logam Mulia", subKategori: "-", berat: 5, karat: "24 K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", aging: 120, status: "Available" },
];

const CABANG_OPTIONS = [
    { value: "blok-m-1", label: "Blok M 1" },
    { value: "blok-m-2", label: "Blok M 2" },
    { value: "blok-m-3", label: "Blok M 3" },
];

const KATEGORI_OPTIONS = [
    { value: "perhiasan", label: "Perhiasan" },
    { value: "logam-mulia", label: "Logam Mulia" },
    { value: "silver", label: "Silver" },
    { value: "berlian", label: "Berlian" },
    { value: "cukim", label: "Cukim" },
];

const STATUS_OPTIONS = [
    { value: "available", label: "Available" },
    { value: "in-repair", label: "In Repair" },
    { value: "transit", label: "Transit" },
    { value: "lost", label: "Lost" },
    { value: "sold", label: "Sold" },
];

const AGING_OPTIONS = [
    { value: "0-30", label: "0-30 Hari" },
    { value: "31-90", label: "31-90 Hari" },
    { value: "91-180", label: "91-180 Hari" },
    { value: ">180", label: ">180 Hari" },
];

const STATUS_TONE = {
    Available: "success",
    "In Repair": "primary",
    Transit: "warning",
    Lost: "danger",
    Sold: "gray",
};

const ReportInventory = () => {
    const [filter, setFilter] = useState({
        cabang: "",
        kategori: "",
        search: "",
        statusDetail: "",
        agingDetail: "",
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
        { header: "Kode", accessor: "kode", render: (row) => <CodeBadge variant="table">{row.kode}</CodeBadge> },
        {
            header: "Produk", accessor: "produk",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-warning-50 text-warning-500">
                        <CoinsIcon size={16} weight="fill" />
                    </span>
                    <span className="text-gray-900">{row.produk}</span>
                </div>
            ),
        },
        { header: "Kategori", accessor: "kategori" },
        { header: "Sub Kategori", accessor: "subKategori" },
        { header: "Berat", accessor: "berat", render: (row) => `${row.berat} gr` },
        { header: "Karat", accessor: "karat" },
        { header: "Modal", accessor: "modal", render: (row) => HelperFunctions.formatCurrency(row.modal) },
        { header: "Jual", accessor: "jual", render: (row) => HelperFunctions.formatCurrency(row.jual) },
        { header: "Cabang", accessor: "cabang" },
        { header: "Aging", accessor: "aging", render: (row) => `${row.aging} Hari` },
        {
            header: "Status", accessor: "status",
            render: (row) => <Badge tone={STATUS_TONE[row.status] || "gray"}>{row.status}</Badge>,
        },
    ];

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Inventory"
                description="Pantau ketersediaan, nilai, dan distribusi item inventory pada setiap cabang."
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-start gap-3 px-4">
                <div className="w-full sm:w-[180px]">
                    <InputGroup
                        fields={[{ name: "cabang", label: "", type: "dropdown", options: CABANG_OPTIONS, placeholder: "Semua Cabang" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
                <div className="w-full sm:w-[180px]">
                    <InputGroup
                        fields={[{ name: "kategori", label: "", type: "dropdown", options: KATEGORI_OPTIONS, placeholder: "Semua Kategori" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Item Aktif" value={SUMMARY.totalItem.toLocaleString("id-ID")} icon={CubeIcon} tone="primary" />
                <StatCard label="Total Berat Aktif" value={`${SUMMARY.totalBerat.toLocaleString("id-ID")} gr`} icon={ScalesIcon} tone="warning" />
                <StatCard label="Total Nilai Modal" value={HelperFunctions.formatCurrency(SUMMARY.nilaiModal)} icon={CoinsIcon} tone="danger" />
                <StatCard
                    label="Total Nilai Jual"
                    value={HelperFunctions.formatCurrency(SUMMARY.nilaiJual)}
                    subLabel={`Margin ${HelperFunctions.formatCurrency(SUMMARY.margin)} • ${SUMMARY.marginPct}%`}
                    icon={TrendUpIcon}
                    tone="success"
                />
            </div>

            {/* Status sekunder */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
                {STATUS_SECONDARY.map((s) => (
                    <MiniStatCard key={s.key} label={s.label} value={s.value.toLocaleString("id-ID")} tone={s.tone} />
                ))}
            </div>

            {/* Distribusi kategori/sub + karat */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Item per Kategori" subtitle="Distribusi item aktif berdasarkan kategori produk.">
                        <BarChartH data={PER_KATEGORI} height={180} currency={false} />
                    </ChartCard>
                    <ChartCard title="Item per Sub Kategori" subtitle="Distribusi item aktif berdasarkan sub kategori produk.">
                        <BarChartH data={PER_SUB_KATEGORI} height={180} currency={false} />
                    </ChartCard>
                </div>
                <ChartCard title="Item per Karat" subtitle="Item aktif berdasarkan karat emas.">
                    <BarChartH data={PER_KARAT} height={400} currency={false} />
                </ChartCard>
            </div>

            {/* Status inventory + Aging */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <ChartCard title="Status Inventory" subtitle="Distribusi item berdasarkan status inventory.">
                    <DonutChart
                        data={STATUS_INVENTORY}
                        colors={["#00c951", "#d63384", "#f9a220", "#fb2c36", "#45556c"]}
                        height={320}
                    />
                </ChartCard>
                <ChartCard title="Inventory Aging" subtitle="Distribusi item aktif berdasarkan lama tersimpan di inventory.">
                    <BarChartH data={INVENTORY_AGING} height={320} currency={false} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="mx-4 rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-gray-950">Detail Inventory</h3>
                    <p className="text-[13px] text-gray-500">Menampilkan detail item inventory sesuai filter yang dipilih.</p>
                </div>

                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <div className="w-full sm:max-w-[320px] sm:flex-1">
                            <InputGroup
                                fields={[{ name: "search", label: "", type: "search", placeholder: "Cari produk.." }]}
                                formData={filter}
                                cols="1"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-[170px]">
                            <InputGroup
                                fields={[{ name: "statusDetail", label: "", type: "dropdown", options: STATUS_OPTIONS, placeholder: "Available" }]}
                                formData={filter}
                                cols="1"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-[170px]">
                            <InputGroup
                                fields={[{ name: "agingDetail", label: "", type: "dropdown", options: AGING_OPTIONS, placeholder: "Semua Aging" }]}
                                formData={filter}
                                cols="1"
                                onChange={handleChange}
                            />
                        </div>
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

export default ReportInventory;
