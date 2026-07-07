import { useEffect, useRef, useState } from "react";
import {
    ChatTextIcon,
    PackageIcon,
    ScalesIcon,
    CurrencyCircleDollarIcon,
    ExportIcon,
} from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import OptionsStore from "../../../Store/OptionsStore";
import ReportApis from "../../../Services/Report.apis";
import { useQueryParams } from "../../../utils/useQueryParams";
import AuthStore from "../../../Store/AuthStore";
import PermissionStore from "../../../Store/PermissionStore";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";

/** [{category_name|subcategory_name, total_nilai}] → [{label, value}] untuk chart. */
const toCategoryChart = (rows, labelKey) =>
    Array.isArray(rows)
        ? rows.map((r) => ({ label: r[labelKey] ?? "-", value: Number(r.total_nilai) || 0 }))
        : [];

/** [{karat, total_nilai}] → [{label, value}] untuk chart. */
const toKaratChart = (rows) =>
    Array.isArray(rows)
        ? rows.map((r) => ({ label: `${r.karat}K`, value: Number(r.total_nilai) || 0 }))
        : [];

const ReportBuyback = () => {
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const user = AuthStore((s) => s.user);
    const isKasir = PermissionStore((s) => s.isKasir);

    const [
        { cabang: urlCabang, page: urlPage, per_page: urlPerPage },
        setQuery,
    ] = useQueryParams({ cabang: "", page: 1, per_page: 10 });

    const [filter, setFilter] = useState({
        dateRange: { mode: "all", start: "", end: "" },
        cabang: urlCabang,
    });

    const [branchOptions, setBranchOptions] = useState([{ value: "", label: "Semua Cabang" }]);

    const [summary, setSummary] = useState({
        jumlah_transaksi: 0,
        total_item: 0,
        total_berat: 0,
        total_nilai: 0,
    });
    const [perKategori, setPerKategori] = useState([]);
    const [perSubKategori, setPerSubKategori] = useState([]);
    const [perKarat, setPerKarat] = useState([]);

    const [detail, setDetail] = useState({ data: [], current_page: 1, total: 0, per_page: 10 });
    const [exporting, setExporting] = useState(false);

    /* Susun query param dari filter aktif. */
    const buildParams = (extra = {}) => {
        const q = new URLSearchParams();
        const { mode, start, end } = filter.dateRange || {};
        if (mode !== "all" && start && end) {
            q.append("start_date", `${start} 00:00:00`);
            q.append("end_date", `${end} 23:59:59`);
        }
        if (filter.cabang) q.append("branch_id", isKasir() ? user.branch_id : filter.cabang);
        Object.entries(extra).forEach(([k, v]) => {
            if (v !== "" && v !== undefined && v !== null) q.append(k, v);
        });
        return q;
    };

    /* ── KPI + chart (refetch saat filter berubah) ── */
    const fetchSummary = async () => {
        setLoading(true);
        try {
            const params = buildParams().toString();
            const suffix = params ? `?${params}` : "";
            const [total, category, karat] = await Promise.all([
                ReportApis.GetBuybackSummary(suffix),
                ReportApis.GetBuybackByCategory(suffix),
                ReportApis.GetBuybackByKarat(suffix),
            ]);
            setSummary({
                jumlah_transaksi: Number(total?.jumlah_transaksi) || 0,
                total_item: Number(total?.total_item) || 0,
                total_berat: Number(total?.total_berat) || 0,
                total_nilai: Number(total?.total_nilai) || 0,
            });
            setPerKategori(toCategoryChart(category?.category, "category_name"));
            setPerSubKategori(toCategoryChart(category?.subcategory, "subcategory_name"));
            setPerKarat(toKaratChart(karat));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /* ── Tabel detail (paginated, refetch saat filter berubah) ── */
    const fetchDetail = async (page = 1, perPage = 10) => {
        setLoading(true);
        try {
            const params = buildParams({ page, per_page: perPage });
            const res = await ReportApis.GetBuybackDetail(`?${params.toString()}`);
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

    // initial load: ambil daftar cabang untuk dropdown
    useEffect(() => {
        (async () => {
            try {
                const branchList = await ensureBranches();
                setBranchOptions([
                    { value: "", label: "Semua Cabang" },
                    ...HelperFunctions.formatDropdown(branchList?.data ?? branchList, "id", "branch_name"),
                ]);
            } catch (error) {
                console.error(error);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const didMount = useRef(false);

    useEffect(() => {
        fetchSummary();
        if (!didMount.current) {
            didMount.current = true;
            fetchDetail(urlPage, urlPerPage);
            return;
        }
        setQuery({ cabang: filter.cabang, page: 1 });
        fetchDetail(1, detail.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.dateRange, filter.cabang]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

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
            await ReportApis.ExportBuyback(params);
        } catch (error) {
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const onChangePage = (page) => {
        setQuery({ page, per_page: detail.per_page });
        fetchDetail(page, detail.per_page);
    };
    const onChangePageSize = (size) => {
        setQuery({ page: 1, per_page: size });
        fetchDetail(1, size);
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
        const total = details.reduce((acc, d) => acc + (Number(d.berat) || 0), 0);
        return total > 0 ? `${total.toLocaleString("id-ID")} gr` : "-";
    };

    const detailColumns = [
        {
            header: "Tanggal",
            accessor: "created_at",
            render: (row) =>
                row.created_at ? new Date(row.created_at).toLocaleDateString("id-ID") : "-",
        },
        { header: "Buyback ID", accessor: "buyback_code" },
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
                const isCash = row.payment_type === "TUNAI";
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

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Buyback"
                description="Rekap transaksi buyback yang sudah selesai diproses — dana telah dikeluarkan dan stok telah masuk ke inventory."
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
                <div className={`w-full sm:w-[180px] ${isKasir() && "hidden"}`}>
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
                <StatCard label="Jumlah Transaksi" value={summary.jumlah_transaksi.toLocaleString("id-ID")} icon={ChatTextIcon} tone="danger" />
                <StatCard label="Total Item" value={summary.total_item.toLocaleString("id-ID")} icon={PackageIcon} tone="info" />
                <StatCard label="Total Berat" value={`${Number(summary.total_berat).toLocaleString("id-ID")} gr`} icon={ScalesIcon} tone="success" />
                <StatCard label="Total Nilai Buyback" value={HelperFunctions.formatCurrency(summary.total_nilai)} icon={CurrencyCircleDollarIcon} tone="warning" />
            </div>

            {/* Per Kategori/Sub Kategori + Per Karat */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Buyback per Kategori" subtitle="Distribusi buyback berdasarkan kategori produk.">
                        <BarChartH data={perKategori} height={Math.max(180, perKategori.length * 40)} />
                    </ChartCard>
                    <ChartCard title="Buyback per Sub Kategori" subtitle="Distribusi buyback berdasarkan sub kategori produk.">
                        <BarChartH data={perSubKategori} height={Math.max(180, perSubKategori.length * 40)} />
                    </ChartCard>
                </div>
                <ChartCard title="Buyback per Karat" subtitle="Distribusi buyback berdasarkan karat emas.">
                    <BarChartH data={perKarat} height={Math.max(400, perKarat.length * 40)} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-950">Detail Buyback</h3>
                        <p className="text-[13px] text-gray-500">Ringkasan transaksi pembelian kembali emas dari customer.</p>
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

export default ReportBuyback;
