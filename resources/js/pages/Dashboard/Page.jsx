import { useEffect, useMemo, useState } from "react";
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
import DashboardApis from "../../Services/Dashboard.apis";
import LoadingStore from "../../Store/LoadingStore";
import OptionsStore from "../../Store/OptionsStore";
import PermissionStore from "../../Store/PermissionStore";
import AuthStore from "../../Store/AuthStore";

const STATUS_TONE = {
    SELESAI: "success",
    APPROVAL: "warning",
    DITOLAK: "danger",
    DIBATALKAN: "danger",
    DISETUJUI: "info",
    "CETAK KWITANSI": "info",
    Selesai: "success",
    Approval: "warning",
    Ditolak: "danger",
    Pending: "warning",
};

const DONUT_COLORS = {
    APPROVAL: "#f9a220",
    DITOLAK: "#fb2c36",
    DIBATALKAN: "#fb2c36",
    SELESAI: "#00c951",
    DISETUJUI: "#3b82f6",
    "CETAK KWITANSI": "#6366f1",
};

const FALLBACK_DONUT_COLORS = ["#f9a220", "#fb2c36", "#00c951", "#3b82f6", "#6366f1"];

const Dashboard = () => {
    const navigate = useNavigate();
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const canApprove = PermissionStore((s) => s.hasPermission("approval.penjualan"));

    const [filter, setFilter] = useState({ cabang: "" });
    const [trendRange, setTrendRange] = useState("7");

    const [pendingActions, setPendingActions] = useState([
        { key: "penjualan", label: "Penjualan", count: 0, path: "/transaksi/penjualan" },
        { key: "pembelian", label: "Pembelian", count: 0, path: "/transaksi/pembelian" },
        { key: "remove-item", label: "Remove Item", count: 0, path: "/inventory/remove-item" },
        { key: "transfer-item", label: "Transfer Item", count: 0, path: "/inventory/transfer-item" },
    ]);

    const [stats, setStats] = useState({
        available_inventory: 0,
        item_sold_today: 0,
        item_bought_today: 0,
        sales_today: 0,
        pembelian_today: 0,
        total_balance: 0,
    });

    const [trendData, setTrendData] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [salesStatus, setSalesStatus] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);

    const totalPending = useMemo(
        () => pendingActions.reduce((acc, a) => acc + a.count, 0),
        [pendingActions]
    );

    const allStatCards = [
        { key: "stok-aktif", label: "Stok Aktif", value: stats.available_inventory?.toLocaleString("id-ID") ?? "0", icon: CubeIcon, tone: "primary" },
        { key: "item-terjual", label: "Item Terjual Hari Ini", value: stats.item_sold_today?.toLocaleString("id-ID") ?? "0", icon: HandbagIcon, tone: "warning" },
        { key: "item-beli", label: "Item Beli Hari Ini", value: stats.item_bought_today?.toLocaleString("id-ID") ?? "0", icon: ShoppingCartIcon, tone: "info" },
        { key: "penjualan", label: "Penjualan Hari Ini", value: HelperFunctions.formatCurrency(stats.sales_today || 0), icon: ChatTextIcon, tone: "success", currency: true },
        { key: "pembelian", label: "Pembelian Hari Ini", value: HelperFunctions.formatCurrency(stats.pembelian_today || 0), icon: ClipboardTextIcon, tone: "danger", currency: true },
        { key: "saldo", label: "Saldo Kas & Bank Saat Ini", value: HelperFunctions.formatCurrency(stats.total_balance || 0), icon: WalletIcon, tone: "primary", currency: true },
    ];

    const statCards = allStatCards;

    const donutData = useMemo(() => {
        return salesStatus.map((s) => ({
            label: s.approval_status,
            value: s.count,
        }));
    }, [salesStatus]);

    const donutColors = useMemo(() => {
        return salesStatus.map((s, i) => DONUT_COLORS[s.approval_status] || FALLBACK_DONUT_COLORS[i % FALLBACK_DONUT_COLORS.length]);
    }, [salesStatus]);

    const chartData = useMemo(() => {
        return trendData.map((d) => ({
            label: d.date,
            value: d.total_sales,
        }));
    }, [trendData]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const promises = [
                canApprove ? DashboardApis.GetTakeAction() : Promise.resolve(null),
                DashboardApis.GetDataToday(),
                DashboardApis.GetSalesTrend(Number(trendRange)),
                DashboardApis.GetLatestSales(),
                DashboardApis.GetSalesStatus(),
            ];

            const [takeAction, dataToday, trend, latest, status] = await Promise.all(promises);

            if (takeAction && canApprove) {
                setPendingActions([
                    { key: "penjualan", label: "Penjualan", count: takeAction.count_penjualan || 0, path: "/transaksi/penjualan" },
                    { key: "pembelian", label: "Pembelian", count: takeAction.count_pembelian || 0, path: "/transaksi/pembelian" },
                    { key: "remove-item", label: "Remove Item", count: takeAction.count_remove_item || 0, path: "/inventory/remove-item" },
                    { key: "transfer-item", label: "Transfer Item", count: takeAction.count_transfer_item || 0, path: "/inventory/transfer-item" },
                ]);
            }

            if (dataToday) {
                setStats({
                    available_inventory: dataToday.available_inventory || 0,
                    item_sold_today: dataToday.item_sold_today || 0,
                    item_bought_today: dataToday.item_bought_today || 0,
                    sales_today: dataToday.sales_today || 0,
                    pembelian_today: dataToday.pembelian_today || 0,
                    total_balance: dataToday.total_balance || 0,
                });
            }

            if (Array.isArray(trend)) {
                setTrendData(trend);
            }

            if (Array.isArray(latest)) {
                setRecentSales(latest.slice(0, 5));
            }

            if (Array.isArray(status)) {
                setSalesStatus(status);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrend = async (days) => {
        try {
            const trend = await DashboardApis.GetSalesTrend(Number(days));
            if (Array.isArray(trend)) {
                setTrendData(trend);
            }
        } catch (error) {
            console.error("Trend fetch error:", error);
        }
    };

    useEffect(() => {
        fetchDashboard();

        if (!isKasir()) {
            ensureBranches().then((branches) => {
                if (Array.isArray(branches)) {
                    setBranchOptions(
                        HelperFunctions.formatDropdown(branches?.data ?? branches, "id", "name")
                    );
                }
            });
        }
    }, []);

    useEffect(() => {
        fetchTrend(trendRange);
    }, [trendRange]);

    const columns = [
        {
            header: "Tanggal",
            accessor: "created_at",
            render: (row) => {
                const dateStr = row.created_at || row.date;
                if (!dateStr) return "-";
                return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
            },
        },
        { header: "Order ID", accessor: "order_id" },
        {
            header: "Customer",
            accessor: "customer",
            render: (row) => row.customer?.name || row.customer_name || "-",
        },
        {
            header: "Status",
            accessor: "approval_status",
            render: (row) => {
                const status = row.approval_status || row.status;
                return <Badge tone={STATUS_TONE[status] || "gray"}>{status}</Badge>;
            },
        },
        {
            header: "Nominal",
            accessor: "grand_total",
            render: (row) => HelperFunctions.formatCurrency(row.grand_total || row.nominal || 0),
        },
        {
            header: "Cabang",
            accessor: "branch",
            render: (row) => row.branch?.name || row.branch_name || "-",
        },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[24px] font-semibold text-gray-950">Dashboard</span>
                    <span className="text-[13px] text-gray-500">
                        {isKasir()
                            ? `Ringkasan operasional cabang ${user?.branch?.name || ""} hari ini.`
                            : "Ringkasan operasional toko emas hari ini."}
                    </span>
                </div>
                {!isKasir() && (
                    <div className="w-full md:w-[200px]">
                        <InputGroup
                            fields={[{
                                name: "cabang",
                                label: "",
                                type: "dropdown",
                                placeholder: "Semua Cabang",
                                options: branchOptions,
                            }]}
                            formData={filter}
                            cols="1"
                            onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                        />
                    </div>
                )}
            </div>

            {/* Perlu tindakan — hanya untuk role yang punya akses approval */}
            {canApprove && (
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
                        {pendingActions.map((action) => (
                            <ActionCard
                                key={action.key}
                                label={action.label}
                                count={action.count}
                                onClick={() => navigate(action.path)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* KPI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => (
                    <StatCard
                        key={stat.key}
                        label={stat.label}
                        value={stat.value}
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
                <LineChart data={chartData} height={320} />
            </ChartCard>

            {/* Penjualan Terkini + Status */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartCard
                    title="Penjualan Terkini"
                    subtitle="5 Transaksi terakhir"
                    className="lg:col-span-2"
                >
                    <Table columns={columns} data={recentSales} paginate={false} />
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
                        data={donutData}
                        colors={donutColors}
                        height={300}
                    />
                </ChartCard>
            </div>
        </div>
    );
};

export default Dashboard;
