import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import {
    UsersThreeIcon,
    UserCircleCheckIcon,
    UserPlusIcon,
    ExportIcon,
    InfoIcon,
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import ReportApis from "../../../Services/Report.apis";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";

const SORT_OPTIONS = [
    { value: "total", label: "By Total Beli" },
    { value: "transaksi", label: "By Transaksi" },
];

/** Ubah objek { label: count } dari API jadi array [{label, value}] untuk chart. */
const toChartData = (obj) =>
    obj ? Object.entries(obj).map(([label, value]) => ({ label, value: Number(value) || 0 })) : [];

/** Normalisasi 1 baris customer dari API ke bentuk yang dipakai UI. */
const mapCustomer = (c) => ({
    id: c.id,
    nama: c.customer_name ?? "-",
    hp: c.phone_number ?? "-",
    transaksi: c.sales_count ?? 0,
    total: Number(c.sales_sum_grand_total ?? 0),
    terakhir: c.sales_max_created_at ?? null,
});

const ReportCustomer = () => {
    const setLoading = LoadingStore((s) => s.setLoading);

    const [filter, setFilter] = useState({
        dateRange: { mode: "all", start: "", end: "" },
        sort: "total",
        search: "",
    });
    const [searchBounce] = useDebounce(filter.search, 500);

    /* Param tanggal dari date range filter — dikirim ke endpoint yang
       mendukung start_date/end_date (top customer, transaksi, detail). */
    const dateParams = () => {
        const q = new URLSearchParams();
        const { mode, start, end } = filter.dateRange || {};
        if (mode !== "all" && start && end) {
            // end_date dijadikan akhir hari supaya transaksi di tanggal "end"
            // ikut terhitung (backend pakai created_at <= end_date).
            q.append("start_date", `${start} 00:00:00`);
            q.append("end_date", `${end} 23:59:59`);
        }
        return q;
    };

    const [summary, setSummary] = useState({ total: 0, aktif: 0, baru: 0 });
    const [topCustomerRaw, setTopCustomerRaw] = useState([]);
    const [frekuensi, setFrekuensi] = useState([]);
    const [segmen, setSegmen] = useState([]);

    const [detail, setDetail] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });
    const [firstLoaded, setFirstLoaded] = useState(false);

    /* ── Fetch KPI + Top Customer + chart (count tidak terpengaruh tanggal) ── */
    const fetchSummary = async () => {
        setLoading(true);
        try {
            const dq = dateParams().toString();
            const [count, top, trx] = await Promise.all([
                ReportApis.GetCustomerCount(),
                ReportApis.GetTopCustomer(dq ? `?${dq}` : ""),
                ReportApis.GetCustomerTransaction(dq ? `?${dq}` : ""),
            ]);
            setSummary({
                total: count?.total_customer ?? 0,
                aktif: count?.customer_active ?? 0,
                baru: count?.new_customer ?? 0,
            });
            setTopCustomerRaw(Array.isArray(top) ? top.map(mapCustomer) : []);
            setFrekuensi(toChartData(trx?.frequency_transaction));
            setSegmen(toChartData(trx?.purchase_segment));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /* ── Fetch tabel Detail (paginated) ──────────────────────── */
    const fetchDetail = async (page = 1, perPage = 10, search = "") => {
        setLoading(true);
        try {
            const query = dateParams();
            query.append("page", page);
            query.append("per_page", perPage);
            if (search) query.append("search", search);

            const res = await ReportApis.GetTopCustomerDetail(`?${query.toString()}`);
            setDetail({
                data: Array.isArray(res?.data) ? res.data.map(mapCustomer) : [],
                current_page: res?.current_page ?? 1,
                total: res?.total ?? 0,
                per_page: res?.per_page ?? perPage,
            });
            setFirstLoaded(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // initial load
    useEffect(() => {
        fetchSummary();
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // refetch saat date range berubah (KPI chart + tabel)
    useEffect(() => {
        if (firstLoaded) {
            fetchSummary();
            fetchDetail(1, detail.per_page, searchBounce);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.dateRange]);

    // refetch saat search berubah (debounced)
    useEffect(() => {
        if (firstLoaded) fetchDetail(1, detail.per_page, searchBounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchBounce]);

    /* Top 5 — disusun ulang client-side sesuai pilihan dropdown.
       (Backend hanya mengurutkan berdasar total pembelian.) */
    const topCustomers = useMemo(() => {
        const key = filter.sort === "transaksi" ? "transaksi" : "total";
        return [...topCustomerRaw]
            .sort((a, b) => b[key] - a[key])
            .map((c, i) => ({ ...c, no: i + 1 }));
    }, [topCustomerRaw, filter.sort]);

    const detailColumns = [
        { header: "Nama Customer", accessor: "nama" },
        { header: "No. HP", accessor: "hp" },
        { header: "Jumlah Transaksi", accessor: "transaksi" },
        {
            header: "Total Pembelian", accessor: "total",
            render: (row) => HelperFunctions.formatCurrency(row.total),
        },
        {
            header: "Transaksi Terakhir", accessor: "terakhir",
            render: (row) => row.terakhir ? new Date(row.terakhir).toLocaleDateString("id-ID") : "-",
        },
    ];

    const topSortLabel =
        filter.sort === "transaksi"
            ? "Diurutkan berdasarkan jumlah transaksi — menunjukkan customer paling sering berbelanja."
            : "Diurutkan berdasarkan total nilai pembelian (Rp) — menunjukkan kontributor revenue terbesar.";

    const onChangePage = (page) => fetchDetail(page, detail.per_page, searchBounce);
    const onChangePageSize = (size) => fetchDetail(1, size, searchBounce);

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Customer"
                description="Analisis data pelanggan, frekuensi transaksi, dan nilai pembelian kumulatif."
            />

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Total Customer" value={summary.total.toLocaleString("id-ID")} icon={UsersThreeIcon} tone="info" />
                <StatCard label="Customer Aktif" value={summary.aktif.toLocaleString("id-ID")} icon={UserCircleCheckIcon} tone="success" />
                <StatCard label="Customer Baru" value={summary.baru.toLocaleString("id-ID")} icon={UserPlusIcon} tone="warning" />
            </div>

            {/* Section title + date filter (filter di bawah title) */}
            <div className="flex flex-col gap-3 px-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-950">Laporan Transaksi Customer</h2>
                    <p className="text-[13px] text-gray-500">Menyajikan rincian aktivitas pelanggan dalam bentuk visual dan data.</p>
                </div>
                <div className="min-w-[220px] max-w-[260px]">
                    <InputGroup
                        fields={[{ name: "dateRange", label: "", type: "daterange" }]}
                        formData={filter}
                        cols="1"
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                {/* Top customer */}
                <ChartCard
                    title="Top Customer"
                    subtitle="Top 5 pelanggan dengan performa terbaik."
                    action={
                        <div className="w-[150px]">
                            <InputGroup
                                fields={[{ name: "sort", label: "", type: "dropdown", options: SORT_OPTIONS, placeholder: "Pilih kategori" }]}
                                formData={filter}
                                cols="1"
                                onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                            />
                        </div>
                    }
                >
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-info-50 px-3 py-2.5 text-[13px] text-info-700">
                        <InfoIcon size={18} className="mt-0.5 shrink-0" />
                        <span>{topSortLabel}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                                    <th className="py-2.5 pr-2 font-medium">No</th>
                                    <th className="py-2.5 pr-2 font-medium">Nama</th>
                                    <th className="py-2.5 pr-2 font-medium">Transaksi</th>
                                    <th className="py-2.5 font-medium">Total Beli</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map((c) => (
                                    <tr key={c.id ?? c.no} className="border-b border-gray-100 last:border-0">
                                        <td className="py-3 pr-2">
                                            {c.no <= 3 ? (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-neutral-white">
                                                    {c.no}
                                                </span>
                                            ) : (
                                                <span className="pl-2 text-gray-500">{c.no}</span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-2 text-gray-900">{c.nama}</td>
                                        <td className="py-3 pr-2 text-gray-700">{c.transaksi}</td>
                                        <td className="py-3 font-medium text-gray-900">{HelperFunctions.formatCurrency(c.total)}</td>
                                    </tr>
                                ))}
                                {topCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-6 text-center text-gray-400">Belum ada data</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>

                {/* Frekuensi + Segmen */}
                <div className="flex flex-col gap-4">
                    <ChartCard title="Frekuensi Transaksi" subtitle="Jumlah customer per rentang frekuensi.">
                        <BarChartH data={frekuensi} color="#0c93eb" height={180} />
                    </ChartCard>
                    <ChartCard title="Segmen Total Pembelian" subtitle="Jumlah customer per rentang nilai pembelian.">
                        <BarChartH data={segmen} color="#0c93eb" height={180} />
                    </ChartCard>
                </div>
            </div>

            {/* Detail table */}
            <div className="mx-4 rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-950">Detail Customer</h3>
                        <p className="text-[13px] text-gray-500">Ringkasan aktivitas transaksi customer.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-[240px]">
                            <InputGroup
                                fields={[{ name: "search", label: "", type: "search", placeholder: "Cari nama customer.." }]}
                                formData={filter}
                                cols="1"
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            />
                        </div>
                        <button
                            type="button"
                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                        >
                            <ExportIcon size={18} /> Export Data
                        </button>
                    </div>
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

export default ReportCustomer;
