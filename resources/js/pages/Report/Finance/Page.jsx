import { useEffect, useMemo, useState } from "react";
import {
    WalletIcon,
    MoneyIcon,
    BankIcon,
    ArrowCircleDownIcon,
    ArrowCircleUpIcon,
    CalendarBlankIcon,
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
import DonutChart from "./Component/DonutChart";
import BranchAccountAccordion from "./Component/BranchAccountAccordion";

const TIPE_OPTIONS = [
    { value: "", label: "Semua Tipe" },
    { value: "CASH IN", label: "Cash In" },
    { value: "CASH OUT", label: "Cash Out" },
];

const METODE_OPTIONS = [
    { value: "", label: "Semua Metode" },
    { value: "CASH", label: "Tunai" },
    { value: "TRANSFER", label: "Transfer" },
];

/** Ubah [{category_name, total}] dari API jadi [{label, value}] untuk donut chart. */
const toChartData = (arr) =>
    Array.isArray(arr)
        ? arr.map((c) => ({ label: c.category_name ?? "-", value: Number(c.total) || 0 }))
        : [];

/** Bentuk teks rekening dari relasi bankCabang. */
const accountLabel = (row) => {
    if (row.payment_method === "CASH") return "Tunai";
    const bc = row.bankCabang ?? row.bank_cabang;
    if (!bc) return "Transfer";
    const bankName = bc.bank?.bank_name ?? "";
    return [bankName, bc.nomor_rekening].filter(Boolean).join(" ") || "Transfer";
};

/**
 * Kelompokkan hasil total-group-by-cabang menjadi struktur untuk accordion:
 * [{ id, name, location, accounts: [{id, name, type, subtitle, balance}] }]
 */
const buildBranches = (rows) => {
    if (!Array.isArray(rows)) return [];
    const map = new Map();
    rows.forEach((row) => {
        const branch = row.branch;
        if (!branch) return;
        if (!map.has(branch.id)) {
            map.set(branch.id, {
                id: branch.id,
                name: branch.branch_name ?? "-",
                location: branch.branch_code ?? "",
                accounts: [],
            });
        }
        const bc = row.bankCabang ?? row.bank_cabang;
        const isCash = !row.bank_cabang_id || !bc;
        map.get(branch.id).accounts.push({
            id: bc?.id ?? `cash-${branch.id}`,
            name: isCash ? "KAS Tunai" : bc.bank?.bank_name ?? "Bank",
            type: isCash ? "cash" : "bank",
            subtitle: isCash ? "Kas laci toko" : bc.nomor_rekening ?? "-",
            balance: Number(row.balance) || 0,
        });
    });
    return Array.from(map.values());
};

const ReportFinance = () => {
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [filter, setFilter] = useState({
        dateRange: { mode: "all", start: "", end: "" },
        cabang: "",
        metode: "",
        tipe: "",
    });

    const [branchOptions, setBranchOptions] = useState([{ value: "", label: "Semua Cabang" }]);

    // KPI total (semua cabang) + accordion saldo per cabang
    const [totals, setTotals] = useState({ total_all: 0, total_cash: 0, total_transfer: 0 });
    const [branches, setBranches] = useState([]);

    // Ringkasan periode + donut
    const [period, setPeriod] = useState({ opening_balance: 0, cash_in: 0, cash_out: 0, closing_balance: 0 });
    const [cashIn, setCashIn] = useState([]);
    const [cashOut, setCashOut] = useState([]);

    // Tabel detail (paginated)
    const [detail, setDetail] = useState({ data: [], current_page: 1, total: 0, per_page: 10 });
    const [firstLoaded, setFirstLoaded] = useState(false);

    /* Susun query param dari filter aktif (dipakai summary & detail). */
    const buildParams = (extra = {}) => {
        const q = new URLSearchParams();
        const { mode, start, end } = filter.dateRange || {};
        if (mode !== "all" && start && end) {
            // end_date dijadikan akhir hari supaya transaksi di tanggal "end"
            // ikut terhitung (backend pakai whereBetween created_at).
            q.append("start_date", `${start} 00:00:00`);
            q.append("end_date", `${end} 23:59:59`);
        }
        if (filter.cabang) q.append("branch_id", filter.cabang);
        if (filter.metode) q.append("payment_method", filter.metode);
        Object.entries(extra).forEach(([k, v]) => {
            if (v !== "" && v !== undefined && v !== null) q.append(k, v);
        });
        return q;
    };

    /* ── KPI total + saldo per cabang (sekali di awal, tidak terpengaruh filter) ── */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [count, grouped, branchList] = await Promise.all([
                    ReportApis.GetFinanceTotalCount(),
                    ReportApis.GetFinanceGroupByCabang(),
                    ensureBranches(),
                ]);
                setTotals({
                    total_all: Number(count?.total_all) || 0,
                    total_cash: Number(count?.total_cash) || 0,
                    total_transfer: Number(count?.total_transfer) || 0,
                });
                setBranches(buildBranches(grouped));
                setBranchOptions([
                    { value: "", label: "Semua Cabang" },
                    ...HelperFunctions.formatDropdown(branchList, "id", "branch_name"),
                ]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Ringkasan periode + donut (refetch saat filter berubah) ── */
    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await ReportApis.GetFinanceSummary(`?${buildParams().toString()}`);
            const s = res?.summary ?? {};
            setPeriod({
                opening_balance: Number(s.opening_balance) || 0,
                cash_in: Number(s.cash_in) || 0,
                cash_out: Number(s.cash_out) || 0,
                closing_balance: Number(s.closing_balance) || 0,
            });
            setCashIn(toChartData(res?.cash_in_category));
            setCashOut(toChartData(res?.cash_out_category));
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
            const params = buildParams({ page, per_page: perPage, type: filter.tipe });
            const res = await ReportApis.GetFinanceDetail(`?${params.toString()}`);
            setDetail({
                data: Array.isArray(res?.data) ? res.data : [],
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

    useEffect(() => {
        fetchSummary();
        fetchDetail(1, detail.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.dateRange, filter.cabang, filter.metode, filter.tipe]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    const periodLabel = useMemo(() => {
        const { mode, start, end } = filter.dateRange || {};
        if (mode === "all" || !start || !end) return "semua periode";
        return `${start} s/d ${end}`;
    }, [filter.dateRange]);

    const detailColumns = [
        {
            header: "Tanggal", accessor: "created_at",
            render: (row) => row.created_at
                ? new Date(row.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
                : "-",
        },
        { header: "Cabang", accessor: "branch", render: (row) => row.branch?.branch_name ?? "-" },
        {
            header: "Tipe", accessor: "type",
            render: (row) => (
                <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${row.type === "CASH IN"
                    ? "border-success-200 bg-success-50 text-success-700"
                    : "border-danger-200 bg-danger-50 text-danger-700"}`}>
                    {row.type === "CASH IN" ? "Cash In" : "Cash Out"}
                </span>
            ),
        },
        { header: "Kategori", accessor: "category", render: (row) => row.category?.category_name ?? "-" },
        {
            header: "Metode Bayar", accessor: "payment_method",
            render: (row) => row.payment_method === "CASH" ? "Tunai" : "Transfer",
        },
        {
            header: "Bank", accessor: "bankCabang",
            render: (row) => row.payment_method === "TRANSFER"
                ? <span className="text-gray-700">{accountLabel(row)}</span>
                : <span className="text-gray-400">-</span>,
        },
        {
            header: "Jumlah", accessor: "nominal",
            render: (row) => HelperFunctions.formatCurrency(Number(row.nominal) || 0),
        },
        {
            header: "Keterangan", accessor: "note",
            render: (row) => <span className="block max-w-[160px] truncate text-gray-600">{row.note || "-"}</span>,
        },
    ];

    const onChangePage = (page) => fetchDetail(page, detail.per_page);
    const onChangePageSize = (size) => fetchDetail(1, size);

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Finance"
                description="Pantau arus kas masuk, keluar, dan saldo akhir per periode dan cabang."
            />

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Total Kas & Bank (semua cabang)"
                    value={HelperFunctions.formatCurrency(totals.total_all)}
                    subLabel={`${branches.length} cabang`}
                    icon={WalletIcon}
                    tone="info"
                />
                <StatCard
                    label="KAS Tunai (semua cabang)"
                    value={HelperFunctions.formatCurrency(totals.total_cash)}
                    subLabel={`${branches.length} cabang`}
                    icon={MoneyIcon}
                    tone="success"
                />
                <StatCard
                    label="Bank (semua cabang)"
                    value={HelperFunctions.formatCurrency(totals.total_transfer)}
                    subLabel={`${branches.length} cabang`}
                    icon={BankIcon}
                    tone="warning"
                />
            </div>

            {/* Saldo per cabang (accordion) */}
            <div className="px-4">
                {branches.length > 0 ? (
                    <BranchAccountAccordion branches={branches} defaultOpenId={branches[0]?.id} />
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-neutral-white py-8 text-center text-sm text-gray-400">
                        Belum ada data saldo cabang
                    </div>
                )}
            </div>

            {/* Section title + filter bar */}
            <div className="px-4">
                <div className="mb-3">
                    <h2 className="text-lg font-semibold text-gray-950">Laporan Transaksi</h2>
                    <p className="text-[13px] text-gray-500">Menyajikan rincian aktivitas keuangan dalam bentuk visual dan data.</p>
                </div>
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
                            fields={[{ name: "cabang", label: "", type: "dropdown", options: branchOptions, placeholder: "Pilih cabang" }]}
                            formData={filter}
                            cols="1"
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full sm:w-[180px]">
                        <InputGroup
                            fields={[{ name: "metode", label: "", type: "dropdown", options: METODE_OPTIONS, placeholder: "Pilih metode" }]}
                            formData={filter}
                            cols="1"
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* Period KPI */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Saldo Awal" value={HelperFunctions.formatCurrency(period.opening_balance)} subLabel={periodLabel} icon={CalendarBlankIcon} tone="info" />
                <StatCard label="Total Cash In" value={HelperFunctions.formatCurrency(period.cash_in)} icon={ArrowCircleDownIcon} tone="success" />
                <StatCard label="Total Cash Out" value={HelperFunctions.formatCurrency(period.cash_out)} icon={ArrowCircleUpIcon} tone="danger" />
                <StatCard label="Saldo Akhir" value={HelperFunctions.formatCurrency(period.closing_balance)} icon={WalletIcon} tone="info" />
            </div>

            {/* Donut charts */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <ChartCard title="Cash In per Kategori">
                    <DonutChart data={cashIn} colors={["#0079d3", "#f9a220", "#00c951", "#7cc8fd"]} />
                </ChartCard>
                <ChartCard title="Cash Out per Kategori">
                    <DonutChart data={cashOut} colors={["#0079d3", "#f9a220", "#00c951", "#fb2c36"]} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="mx-4 rounded-lg border border-gray-200 bg-neutral-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-950">Detail Transaksi</h3>
                        <p className="text-[13px] text-gray-500">Daftar lengkap transaksi keuangan untuk kebutuhan monitoring dan analisis.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-[160px]">
                            <InputGroup
                                fields={[{ name: "tipe", label: "", type: "dropdown", options: TIPE_OPTIONS, placeholder: "Semua Tipe" }]}
                                formData={filter}
                                cols="1"
                                onChange={handleChange}
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

export default ReportFinance;
