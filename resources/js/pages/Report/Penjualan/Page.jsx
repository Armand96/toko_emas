import { useEffect, useMemo, useState } from "react";
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
import LoadingStore from "../../../Store/LoadingStore";
import OptionsStore from "../../../Store/OptionsStore";
import ReportApis from "../../../Services/Report.apis";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";
import LineChart from "./Component/LineChart";

const ReportPenjualan = () => {
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [filter, setFilter] = useState({
        dateRange: { mode: "all", start: "", end: "" },
        cabang: "",
    });

    const [branchOptions, setBranchOptions] = useState([{ value: "", label: "Semua Cabang" }]);

    const [summary, setSummary] = useState({
        total_penjualan: 0,
        jumlah_transaksi: 0,
        laba: 0,
        emas_terjual: 0,
    });

    const [trend, setTrend] = useState([]);
    const [topProduct, setTopProduct] = useState([]);
    const [category, setCategory] = useState([]);
    const [subcategory, setSubcategory] = useState([]);
    const [karat, setKarat] = useState([]);
    const [detail, setDetail] = useState({ data: [], current_page: 1, total: 0, per_page: 10 });
    const [exporting, setExporting] = useState(false);

    const buildParams = (extra = {}) => {
        const q = new URLSearchParams();
        const { mode, start, end } = filter.dateRange || {};
        if (mode !== "all" && start && end) {
            q.append("start_date", `${start} 00:00:00`);
            q.append("end_date", `${end} 23:59:59`);
        }
        if (filter.cabang) q.append("branch_id", filter.cabang);
        Object.entries(extra).forEach(([k, v]) => {
            if (v !== "" && v !== undefined && v !== null) q.append(k, v);
        });
        return q;
    };

    const fetchCharts = async () => {
        setLoading(true);
        try {
            const params = buildParams();
            const qs = params.toString() ? `?${params.toString()}` : "";

            const [summaryRes, trendRes, categoryRes] = await Promise.all([
                ReportApis.GetSalesSummary(qs),
                ReportApis.GetSalesTrend(qs),
                ReportApis.GetSalesByCategory(qs),
            ]);

            if (summaryRes) {
                setSummary({
                    total_penjualan: Number(summaryRes.total_penjualan) || 0,
                    jumlah_transaksi: Number(summaryRes.jumlah_transaksi) || 0,
                    laba: Number(summaryRes.laba) || 0,
                    emas_terjual: Number(summaryRes.emas_terjual) || 0,
                });
            }

            if (trendRes) {
                setTrend(
                    Array.isArray(trendRes.trend)
                        ? trendRes.trend.map((t) => ({
                              label: t.trx_date ? new Date(t.trx_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-",
                              value: Number(t.total) || 0,
                          }))
                        : []
                );
                setTopProduct(Array.isArray(trendRes.top_product) ? trendRes.top_product : []);
            }

            if (categoryRes) {
                setCategory(
                    Array.isArray(categoryRes.category)
                        ? categoryRes.category.map((c) => ({ label: c.category_name ?? "-", value: Number(c.total) || 0 }))
                        : []
                );
                setSubcategory(
                    Array.isArray(categoryRes.subcategory)
                        ? categoryRes.subcategory.map((c) => ({ label: c.subcategory_name ?? "-", value: Number(c.total) || 0 }))
                        : []
                );
                setKarat(
                    Array.isArray(categoryRes.karat)
                        ? categoryRes.karat.map((k) => ({ label: k.karat ?? "-", value: Number(k.total) || 0 }))
                        : []
                );
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (page = 1, perPage = 10) => {
        setLoading(true);
        try {
            const params = buildParams({ page, per_page: perPage });
            const res = await ReportApis.GetSalesDetail(`?${params.toString()}`);
            setDetail({
                data: Array.isArray(res?.data) ? res.data : [],
                current_page: res?.current_page ?? 1,
                total: res?.total ?? 0,
                per_page: res?.per_page ?? perPage,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ensureBranches().then((branchList) => {
            if (Array.isArray(branchList)) {
                setBranchOptions([
                    { value: "", label: "Semua Cabang" },
                    ...HelperFunctions.formatDropdown(branchList?.data ?? branchList, "id", "branch_name"),
                ]);
            }
        });
    }, []);

    useEffect(() => {
        fetchCharts();
        fetchDetail(1, detail.per_page);
    }, [filter.dateRange, filter.cabang]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    const itemsSummary = (row) => {
        const details = row.details ?? [];
        if (details.length === 0) return "-";
        const names = details.map((d) => d.product?.product_name ?? "-");
        const joined = names.slice(0, 2).join(", ");
        return details.length > 2 ? `${joined}..` : joined;
    };

    const totalBerat = (row) => {
        const details = row.details ?? [];
        const total = details.reduce((acc, d) => acc + (Number(d.inventory?.berat) || 0), 0);
        return total > 0 ? `${total} gr` : "-";
    };

    const detailColumns = [
        {
            header: "Tanggal",
            accessor: "created_at",
            render: (row) =>
                row.created_at
                    ? new Date(row.created_at).toLocaleDateString("id-ID")
                    : "-",
        },
        { header: "Order ID", accessor: "order_id" },
        {
            header: "Customer",
            accessor: "customer",
            render: (row) => row.customer?.customer_name ?? "-",
        },
        {
            header: "Item Produk",
            accessor: "details",
            render: (row) => itemsSummary(row),
        },
        {
            header: "Total Berat",
            accessor: "berat",
            render: (row) => totalBerat(row),
        },
        {
            header: "Nominal",
            accessor: "grand_total",
            render: (row) => HelperFunctions.formatCurrency(Number(row.grand_total) || 0),
        },
        {
            header: "Pembayaran",
            accessor: "payment_type",
            render: (row) => {
                const type = row.payment_type;
                const isCash = type === "CASH" || type === "Tunai";
                return (
                    <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                            isCash
                                ? "border-success-200 bg-success-50 text-success-700"
                                : "border-info-200 bg-info-50 text-info-700"
                        }`}
                    >
                        {isCash ? "Tunai" : "Transfer"}
                    </span>
                );
            },
        },
        {
            header: "Cabang",
            accessor: "branch",
            render: (row) => row.branch?.branch_name ?? "-",
        },
        {
            header: "User",
            accessor: "user",
            render: (row) => row.user?.name ?? "-",
        },
    ];

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const params = {};
            const { mode, start, end } = filter.dateRange || {};
            if (mode !== "all" && start && end) {
                params.start_date = `${start} 00:00:00`;
                params.end_date = `${end} 23:59:59`;
            }
            if (filter.cabang) params.branch_id = filter.cabang;
            await ReportApis.ExportSales(params);
        } catch (error) {
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const onChangePage = (page) => fetchDetail(page, detail.per_page);
    const onChangePageSize = (size) => fetchDetail(1, size);

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Penjualan"
                description="Analisis penjualan, produk terlaris, dan performa toko untuk mendukung pengambilan keputusan."
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-start gap-3">
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
                        fields={[{
                            name: "cabang",
                            label: "",
                            type: "dropdown",
                            options: branchOptions,
                            placeholder: "Pilih cabang",
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Penjualan" value={HelperFunctions.formatCurrency(summary.total_penjualan)} icon={ReceiptIcon} tone="info" />
                <StatCard label="Jumlah Transaksi" value={summary.jumlah_transaksi.toLocaleString("id-ID")} icon={ChatTextIcon} tone="danger" />
                <StatCard label="Laba" value={HelperFunctions.formatCurrency(summary.laba)} icon={TrendUpIcon} tone="success" />
                <StatCard label="Emas Terjual" value={`${Number(summary.emas_terjual).toLocaleString("id-ID")} gr`} icon={ScalesIcon} tone="warning" />
            </div>

            {/* Tren + Produk Terlaris */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Tren Penjualan" subtitle="Perkembangan omzet penjualan harian">
                    <LineChart data={trend} />
                </ChartCard>

                <ChartCard title="Produk Terlaris" subtitle="Top 5 berdasarkan jumlah terjual">
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
                                {topProduct.length > 0 ? (
                                    topProduct.map((p, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-0">
                                            <td className="py-3 pr-2">
                                                {i < 3 ? (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-neutral-white">
                                                        {i + 1}
                                                    </span>
                                                ) : (
                                                    <span className="pl-2 text-gray-500">{i + 1}</span>
                                                )}
                                            </td>
                                            <td className="py-3 pr-2 text-gray-900">{p.product_name ?? "-"}</td>
                                            <td className="py-3 pr-2 text-gray-700">{p.karat ?? "-"}</td>
                                            <td className="py-3 pr-2 text-gray-700">{p.berat ? `${Number(p.berat).toFixed(1)} gr` : "-"}</td>
                                            <td className="py-3 font-medium text-gray-900">{p.terjual ?? 0}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-gray-400">Belum ada data</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>

            {/* Per Kategori/Sub Kategori + Per Karat */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Penjualan per Kategori" subtitle="Distribusi penjualan berdasarkan kategori produk.">
                        <BarChartH data={category} height={Math.max(180, category.length * 40)} />
                    </ChartCard>
                    <ChartCard title="Penjualan per Sub Kategori" subtitle="Distribusi penjualan berdasarkan sub kategori produk.">
                        <BarChartH data={subcategory} height={Math.max(180, subcategory.length * 40)} />
                    </ChartCard>
                </div>
                <ChartCard title="Penjualan per Karat" subtitle="Distribusi penjualan berdasarkan karat emas.">
                    <BarChartH data={karat} height={Math.max(400, karat.length * 40)} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-950">Detail Penjualan</h3>
                        <p className="text-[13px] text-gray-500">Pantau seluruh aktivitas penjualan emas secara real-time.</p>
                    </div>
                    <button
                        type="button"
                        disabled={exporting}
                        onClick={handleExport}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
                    >
                        <ExportIcon size={18} /> {exporting ? "Downloading..." : "Export Data"}
                    </button>
                </div>

                <Table
                    columns={detailColumns}
                    data={detail.data}
                    page={detail.current_page}
                    pageSize={detail.per_page}
                    total={detail.total}
                    onPageChange={onChangePage}
                    onPageSizeChange={onChangePageSize}
                />
            </div>
        </div>
    );
};

export default ReportPenjualan;
