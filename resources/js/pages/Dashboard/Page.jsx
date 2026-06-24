import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
    WarningCircleIcon,
    CubeIcon,
    HandbagIcon,
    ShoppingCartIcon,
    ChatTextIcon,
    ClipboardTextIcon,
    WalletIcon,
    CaretRightIcon,
} from "@phosphor-icons/react";
import Badge from "../../components/Badge";
import Table from "../../components/Table/Table";
import InputGroup from "../../components/FormElement/InputGroup";
import HelperFunctions from "../../utils/HelperFunctions";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import ActionCard from "./Component/ActionCard";
import LineChart from "./Component/LineChart";
import DonutChart from "./Component/DonutChart";

const BRANCH_OPTIONS = [
    { value: "blok-m-1", label: "Blok M 1" },
];

/* ── Data dummy (menyusul integrasi API dashboard) ───────────────── */
const PENDING_ACTIONS = [
    { key: "penjualan", label: "Penjualan", count: 3, path: "/transaksi/penjualan" },
    { key: "pembelian", label: "Pembelian", count: 2, path: "/transaksi/pembelian" },
    { key: "remove-item", label: "Remove Item", count: 1, path: "/inventory/remove-item" },
    { key: "transfer-item", label: "Transfer Item", count: 4, path: "/inventory/transfer-item" },
];

const STATS = [
    { key: "stok-aktif", label: "Stok Aktif", value: "6.000", icon: CubeIcon, tone: "primary" },
    { key: "item-terjual", label: "Item Terjual Hari Ini", value: "6.000", icon: HandbagIcon, tone: "warning" },
    { key: "item-beli", label: "Item Beli Hari Ini", value: "20", icon: ShoppingCartIcon, tone: "info" },
    { key: "penjualan", label: "Penjualan Hari Ini", value: 5_000_000_000, icon: ChatTextIcon, tone: "success", currency: true },
    { key: "pembelian", label: "Pembelian Hari Ini", value: 5_000_000_000, icon: ClipboardTextIcon, tone: "danger", currency: true },
    { key: "saldo", label: "Saldo Kas & Bank Saat Ini", value: 8_000_000_000, icon: WalletIcon, tone: "primary", currency: true },
];

const SALES_TREND_7 = [
    { label: "01 Jun", value: 42_000_000 },
    { label: "02 Jun", value: 54_000_000 },
    { label: "03 Jun", value: 31_000_000 },
    { label: "04 Jun", value: 72_000_000 },
    { label: "05 Jun", value: 20_000_000 },
    { label: "06 Jun", value: 62_000_000 },
    { label: "07 Jun", value: 62_000_000 },
];

const SALES_TREND_30 = Array.from({ length: 30 }, (_, i) => ({
    label: `${String(i + 1).padStart(2, "0")} Jun`,
    value: 20_000_000 + Math.round(Math.abs(Math.sin(i / 2)) * 60_000_000),
}));

const RECENT_SALES = [
    { id: 1, date: "2026-05-11", order_id: "ORD-00015", customer: "Sofia Martinez", status: "Selesai", nominal: 100_000_000, branch: "Blok M 1" },
    { id: 2, date: "2026-05-11", order_id: "ORD-00014", customer: "Yuki Tanaka", status: "Approval", nominal: 100_000_000, branch: "Blok M 1" },
    { id: 3, date: "2026-05-11", order_id: "ORD-00013", customer: "Yuki Tanaka", status: "Ditolak", nominal: 100_000_000, branch: "Blok M 1" },
    { id: 4, date: "2026-05-11", order_id: "ORD-00012", customer: "Sofia Martinez", status: "Selesai", nominal: 100_000_000, branch: "Blok M 1" },
];

const SALES_STATUS = [
    { label: "Pending", value: 2 },
    { label: "Ditolak", value: 1 },
    { label: "Selesai", value: 7 },
];

const STATUS_TONE = {
    Selesai: "success",
    Approval: "warning",
    Ditolak: "danger",
    Pending: "warning",
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState({ cabang: "" });
    const [trendRange, setTrendRange] = useState("7"); // "7" | "30"

    const totalPending = useMemo(
        () => PENDING_ACTIONS.reduce((acc, a) => acc + a.count, 0),
        []
    );

    const trendData = trendRange === "7" ? SALES_TREND_7 : SALES_TREND_30;

    const columns = [
        { header: "Tanggal", accessor: "date", render: (row) => HelperFunctions.formatDate?.(row.date) ?? new Date(row.date).toLocaleDateString("id-ID") },
        { header: "Order ID", accessor: "order_id" },
        { header: "Customer", accessor: "customer" },
        {
            header: "Status",
            accessor: "status",
            render: (row) => <Badge tone={STATUS_TONE[row.status] || "gray"}>{row.status}</Badge>,
        },
        { header: "Nominal", accessor: "nominal", render: (row) => HelperFunctions.formatCurrency(row.nominal || 0) },
        { header: "Cabang", accessor: "branch" },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Header */}
            <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[24px] font-semibold text-gray-950">Dashboard</span>
                    <span className="text-[13px] text-gray-500">Ringkasan operasional toko emas hari ini.</span>
                </div>
                <div className="w-full md:w-[200px]">
                    <InputGroup
                        fields={[{
                            name: "cabang",
                            label: "",
                            type: "dropdown",
                            placeholder: "Semua Cabang",
                            options: BRANCH_OPTIONS,
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
            </div>

            {/* Perlu tindakan */}
            <div className="rounded-xl border border-warning-200 bg-warning-50/50 p-5">
                <div className="mb-4 flex items-start gap-3 border-b border-warning-200/70 pb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-600">
                        <WarningCircleIcon size={20} weight="fill" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-semibold text-warning-700">Perlu tindakan</span>
                        <span className="text-[13px] text-warning-600/90">
                            {totalPending} pengajuan berikut sedang menunggu persetujuan Anda sebelum bisa diproses lebih lanjut.
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {PENDING_ACTIONS.map((action) => (
                        <ActionCard
                            key={action.key}
                            label={action.label}
                            count={action.count}
                            onClick={() => navigate(action.path)}
                        />
                    ))}
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {STATS.map((stat) => (
                    <StatCard
                        key={stat.key}
                        label={stat.label}
                        value={stat.currency ? HelperFunctions.formatCurrency(stat.value) : stat.value}
                        icon={stat.icon}
                        tone={stat.tone}
                    />
                ))}
            </div>

            {/* Tren Penjualan */}
            <ChartCard
                title="Tren Penjualan"
                subtitle={`Perkembangan omzet penjualan harian ${trendRange === "7" ? "7" : "30"} hari terakhir`}
                action={
                    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                        {[
                            { key: "7", label: "7 Hari" },
                            { key: "30", label: "30 Hari" },
                        ].map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setTrendRange(opt.key)}
                                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                                    trendRange === opt.key
                                        ? "bg-neutral-white text-primary-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                }
            >
                <LineChart data={trendData} height={320} />
            </ChartCard>

            {/* Penjualan Terkini + Status */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartCard
                    title="Penjualan Terkini"
                    subtitle="5 Transaksi terakhir"
                    className="lg:col-span-2"
                >
                    <Table columns={columns} data={RECENT_SALES} paginate={false} />
                    <button
                        type="button"
                        onClick={() => navigate("/transaksi/penjualan")}
                        className="mt-4 flex items-center justify-center gap-1 text-[13px] font-semibold text-primary-600 transition-colors duration-200 hover:text-primary-700"
                    >
                        Lihat Semua Transaksi <CaretRightIcon size={16} weight="bold" />
                    </button>
                </ChartCard>

                <ChartCard title="Status Penjualan" subtitle="Status penjualan hari ini">
                    <DonutChart
                        data={SALES_STATUS}
                        colors={["#f9a220", "#fb2c36", "#00c951"]}
                        height={300}
                    />
                </ChartCard>
            </div>
        </div>
    );
};

export default Dashboard;
