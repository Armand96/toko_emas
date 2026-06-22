import { useMemo, useState } from "react";
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
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import DonutChart from "./Component/DonutChart";
import BranchAccountAccordion from "./Component/BranchAccountAccordion";

/* ──────────────────────────────────────────────────────────
   DUMMY DATA (parent) — nanti tinggal diganti hasil API
   ────────────────────────────────────────────────────────── */
const SUMMARY = {
    total: 38260000,
    kas: 18260000,
    bank: 20000000,
    cabang: 5,
    per: "15 Jun 2025",
};

const makeAccounts = () => [
    { id: 1, name: "KAS Tunai", type: "cash", subtitle: "Kas laci toko", balance: 6760000 },
    { id: 2, name: "BCA", type: "bank", subtitle: "0312512365718", balance: 6760000 },
    { id: 3, name: "BCA", type: "bank", subtitle: "123 999 XXX", balance: 6760000 },
];

const BRANCHES = [
    { id: 1, name: "BLOK M 1", location: "Jakarta Pusat", accounts: makeAccounts() },
    { id: 2, name: "BLOK M 2", location: "Jakarta Pusat", accounts: makeAccounts() },
    { id: 3, name: "BLOK M 3", location: "Jakarta Pusat", accounts: makeAccounts() },
];

const PERIOD = {
    saldoAwal: 0,
    cashOut: 14220000,
    cashIn: 22480000,
    saldoAkhir: 8260000,
};

const CASH_IN = [
    { label: "Penjualan", value: 16000000 },
    { label: "Setoran Modal", value: 5000000 },
    { label: "Lainnya", value: 1480000 },
];

const CASH_OUT = [
    { label: "Pembelian", value: 8000000 },
    { label: "Gaji", value: 3000000 },
    { label: "Operasional", value: 1500000 },
    { label: "Lainnya", value: 1720000 },
];

const DETAIL = [
    { id: 1, tanggal: "2026-05-11 08:15", cabang: "Blok M 2", tipe: "CASH IN", kategori: "Penjualan", metode: "Tunai", bank: "", nominal: 36791000, ket: "Catatan aja" },
    { id: 2, tanggal: "2026-05-11 08:15", cabang: "Blok M 2", tipe: "CASH IN", kategori: "Penjualan", metode: "Transfer", bank: "BCA 0312512365718", nominal: 36791000, ket: "Catatan aja" },
    { id: 3, tanggal: "2026-05-10 14:02", cabang: "Blok M 1", tipe: "CASH OUT", kategori: "Pembelian", metode: "Transfer", bank: "BCA 2492492349", nominal: 12500000, ket: "Beli stok" },
    { id: 4, tanggal: "2026-05-10 09:30", cabang: "Blok M 3", tipe: "CASH OUT", kategori: "Gaji", metode: "Tunai", bank: "", nominal: 5000000, ket: "Gaji karyawan" },
    { id: 5, tanggal: "2026-05-09 16:45", cabang: "Blok M 2", tipe: "CASH IN", kategori: "Setoran Modal", metode: "Transfer", bank: "BNI 0378314234", nominal: 5000000, ket: "Setoran" },
    { id: 6, tanggal: "2026-05-09 11:20", cabang: "Blok M 1", tipe: "CASH OUT", kategori: "Operasional", metode: "Tunai", bank: "", nominal: 850000, ket: "Listrik" },
    { id: 7, tanggal: "2026-05-08 13:10", cabang: "Blok M 3", tipe: "CASH IN", kategori: "Penjualan", metode: "Tunai", bank: "", nominal: 9200000, ket: "-" },
    { id: 8, tanggal: "2026-05-08 10:00", cabang: "Blok M 2", tipe: "CASH OUT", kategori: "Pembelian", metode: "Transfer", bank: "BCA 0378314234", nominal: 7400000, ket: "Beli emas" },
    { id: 9, tanggal: "2026-05-07 15:35", cabang: "Blok M 1", tipe: "CASH IN", kategori: "Lainnya", metode: "Tunai", bank: "", nominal: 1480000, ket: "Lain-lain" },
    { id: 10, tanggal: "2026-05-07 09:05", cabang: "Blok M 3", tipe: "CASH OUT", kategori: "Lainnya", metode: "Tunai", bank: "", nominal: 1720000, ket: "Misc" },
    { id: 11, tanggal: "2026-05-06 12:00", cabang: "Blok M 2", tipe: "CASH IN", kategori: "Penjualan", metode: "Tunai", bank: "", nominal: 4300000, ket: "-" },
    { id: 12, tanggal: "2026-05-06 08:40", cabang: "Blok M 1", tipe: "CASH OUT", kategori: "Operasional", metode: "Transfer", bank: "BCA 2492492349", nominal: 650000, ket: "Internet" },
];

const CABANG_OPTIONS = [
    { value: "", label: "Semua Cabang" },
    { value: "blok-m-1", label: "Blok M 1" },
    { value: "blok-m-2", label: "Blok M 2" },
    { value: "blok-m-3", label: "Blok M 3" },
];

/* Bank muncul sesuai cabang yang dipilih (cascading). */
const BANK_BY_CABANG = {
    "": [{ value: "", label: "Semua Bank" }, { value: "tunai", label: "Tunai" }],
    "blok-m-1": [
        { value: "", label: "Semua Bank" },
        { value: "tunai", label: "Tunai" },
        { value: "01", label: "01 - BCA (0378314234)" },
        { value: "02", label: "02 - BCA (2492492349)" },
    ],
    "blok-m-2": [
        { value: "", label: "Semua Bank" },
        { value: "tunai", label: "Tunai" },
        { value: "03", label: "03 - BNI (0378314234)" },
        { value: "04", label: "04 - BCA (0378314234)" },
    ],
    "blok-m-3": [
        { value: "", label: "Semua Bank" },
        { value: "tunai", label: "Tunai" },
        { value: "05", label: "05 - BCA (123999XXX)" },
    ],
};

const TIPE_OPTIONS = [
    { value: "", label: "Semua Tipe" },
    { value: "CASH IN", label: "Cash In" },
    { value: "CASH OUT", label: "Cash Out" },
];

const ReportFinance = () => {
    const [filter, setFilter] = useState({
        dateRange: { mode: "range", start: "2026-06-01", end: "2026-06-15" },
        cabang: "",
        bank: "",
        tipe: "",
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const bankOptions = BANK_BY_CABANG[filter.cabang] || BANK_BY_CABANG[""];

    const handleChange = (e) => {
        const { name, value } = e.target;
        // reset bank saat cabang berubah supaya tidak menyisakan pilihan tak valid
        if (name === "cabang") {
            setFilter((prev) => ({ ...prev, cabang: value, bank: "" }));
            return;
        }
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    const filteredDetail = useMemo(() => {
        return DETAIL.filter((d) => (filter.tipe ? d.tipe === filter.tipe : true));
    }, [filter.tipe]);

    const pagedDetail = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredDetail.slice(start, start + pageSize);
    }, [filteredDetail, page, pageSize]);

    const detailColumns = [
        {
            header: "Tanggal", accessor: "tanggal", sortable: true,
            render: (row) => new Date(row.tanggal).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }),
        },
        { header: "Cabang", accessor: "cabang" },
        {
            header: "Tipe", accessor: "tipe",
            render: (row) => (
                <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${row.tipe === "CASH IN"
                    ? "border-success-200 bg-success-50 text-success-700"
                    : "border-danger-200 bg-danger-50 text-danger-700"}`}>
                    {row.tipe === "CASH IN" ? "Cash In" : "Cash Out"}
                </span>
            ),
        },
        { header: "Kategori", accessor: "kategori" },
        { header: "Metode Bayar", accessor: "metode" },
        {
            header: "Bank", accessor: "bank",
            render: (row) => row.bank ? <span className="text-gray-700">{row.bank}</span> : <span className="text-gray-400">-</span>,
        },
        {
            header: "Jumlah", accessor: "nominal",
            render: (row) => HelperFunctions.formatCurrency(row.nominal),
        },
        {
            header: "Keterangan", accessor: "ket",
            render: (row) => <span className="block max-w-[160px] truncate text-gray-600">{row.ket || "-"}</span>,
        },
    ];

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
                    value={HelperFunctions.formatCurrency(SUMMARY.total)}
                    subLabel={`${SUMMARY.cabang} cabang • per ${SUMMARY.per}`}
                    icon={WalletIcon}
                    tone="info"
                />
                <StatCard
                    label="KAS Tunai (semua cabang)"
                    value={HelperFunctions.formatCurrency(SUMMARY.kas)}
                    subLabel={`${SUMMARY.cabang} cabang • per ${SUMMARY.per}`}
                    icon={MoneyIcon}
                    tone="success"
                />
                <StatCard
                    label="Bank (semua cabang)"
                    value={HelperFunctions.formatCurrency(SUMMARY.bank)}
                    subLabel={`${SUMMARY.cabang} cabang • per ${SUMMARY.per}`}
                    icon={BankIcon}
                    tone="warning"
                />
            </div>

            {/* Saldo per cabang (accordion) */}
            <div className="px-4">
                <BranchAccountAccordion branches={BRANCHES} defaultOpenId={3} />
            </div>

            {/* Section title + filter bar */}
            <div className="px-4">
                <div className="mb-3">
                    <h2 className="text-lg font-semibold text-gray-950">Laporan Transaksi</h2>
                    <p className="text-[13px] text-gray-500">Menyajikan rincian aktivitas keuangan dalam bentuk visual dan data.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px]">
                        <InputGroup
                            fields={[{ name: "dateRange", label: "", type: "daterange" }]}
                            formData={filter}
                            cols="1"
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-[180px]">
                        <InputGroup
                            fields={[{ name: "cabang", label: "", type: "dropdown", options: CABANG_OPTIONS, placeholder: "Pilih cabang" }]}
                            formData={filter}
                            cols="1"
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-[200px]">
                        <InputGroup
                            fields={[{ name: "bank", label: "", type: "dropdown", options: bankOptions, placeholder: "Pilih bank" }]}
                            formData={filter}
                            cols="1"
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* Period KPI */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Saldo Awal" value={HelperFunctions.formatCurrency(PERIOD.saldoAwal)} icon={ArrowCircleDownIcon} tone="success" />
                <StatCard label="Total Cash Out" value={HelperFunctions.formatCurrency(PERIOD.cashOut)} icon={ArrowCircleUpIcon} tone="danger" />
                <StatCard label="Total Cash In" value={HelperFunctions.formatCurrency(PERIOD.cashIn)} icon={ArrowCircleDownIcon} tone="success" />
                <StatCard label="Saldo Akhir" value={HelperFunctions.formatCurrency(PERIOD.saldoAkhir)} icon={CalendarBlankIcon} tone="info" />
            </div>

            {/* Donut charts */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <ChartCard title="Cash In per Kategori">
                    <DonutChart data={CASH_IN} colors={["#0079d3", "#f9a220", "#00c951"]} />
                </ChartCard>
                <ChartCard title="Cash Out per Kategori">
                    <DonutChart data={CASH_OUT} colors={["#0079d3", "#f9a220", "#00c951", "#fb2c36"]} />
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
                                onChange={(e) => { handleChange(e); setPage(1); }}
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
                    data={pagedDetail}
                    page={page}
                    pageSize={pageSize}
                    total={filteredDetail.length}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                />
            </div>
        </div>
    );
};

export default ReportFinance;
