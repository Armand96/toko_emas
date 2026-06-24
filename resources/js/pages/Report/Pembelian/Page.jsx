import { useEffect, useState } from "react";
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
import LoadingStore from "../../../Store/LoadingStore";
import OptionsStore from "../../../Store/OptionsStore";
import ReportApis from "../../../Services/Report.apis";
import StatCard from "./Component/StatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";

/** [{category_name|subcategory_name, total_modal}] → [{label, value}] untuk chart. */
const toCategoryChart = (rows, labelKey) =>
    Array.isArray(rows)
        ? rows.map((r) => ({ label: r[labelKey] ?? "-", value: Number(r.total_modal) || 0 }))
        : [];

/** [{karat, total_modal}] → [{label, value}] untuk chart. */
const toKaratChart = (rows) =>
    Array.isArray(rows)
        ? rows.map((r) => ({ label: `${r.karat}K`, value: Number(r.total_modal) || 0 }))
        : [];

const ReportPembelian = () => {
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [filter, setFilter] = useState({
        dateRange: { mode: "all", start: "", end: "" },
        cabang: "",
    });

    const [branchOptions, setBranchOptions] = useState([{ value: "", label: "Semua Cabang" }]);

    const [summary, setSummary] = useState({ totalItem: 0, totalBerat: 0, totalNilai: 0 });
    const [perKategori, setPerKategori] = useState([]);
    const [perSubKategori, setPerSubKategori] = useState([]);
    const [perKarat, setPerKarat] = useState([]);

    const [detail, setDetail] = useState({ data: [], current_page: 1, total: 0, per_page: 10 });

    /* Susun query param dari filter aktif. */
    const buildParams = (extra = {}) => {
        const q = new URLSearchParams();
        const { mode, start, end } = filter.dateRange || {};
        if (mode !== "all" && start && end) {
            q.append("start_date", start);
            q.append("end_date", end);
        }
        if (filter.cabang) q.append("branch_id", filter.cabang);
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
                ReportApis.GetPembelianTotalItem(suffix),
                ReportApis.GetPembelianByCategory(suffix),
                ReportApis.GetPembelianByKarat(suffix),
            ]);
            setSummary({
                totalItem: Number(total?.total_item_dibeli) || 0,
                totalBerat: Number(total?.total_berat) || 0,
                totalNilai: Number(total?.total_nilai) || 0,
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
            const res = await ReportApis.GetPembelianDetail(`?${params.toString()}`);
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
                    ...HelperFunctions.formatDropdown(branchList, "id", "branch_name"),
                ]);
            } catch (error) {
                console.error(error);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchSummary();
        fetchDetail(1, detail.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.dateRange, filter.cabang]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    const onChangePage = (page) => fetchDetail(page, detail.per_page);
    const onChangePageSize = (size) => fetchDetail(1, size);

    const detailColumns = [
        {
            header: "Tanggal", accessor: "tanggal",
            render: (row) => (row.tanggal ? new Date(row.tanggal).toLocaleDateString("id-ID") : "-"),
        },
        { header: "Batch", accessor: "batch" },
        {
            header: "Supplier", accessor: "supplier",
            render: (row) => row.supplier?.supplier_name ?? row.supplier_id ?? "-",
        },
        {
            header: "Cabang", accessor: "branch",
            render: (row) => row.branch?.branch_name ?? "-",
        },
        { header: "Total Item", accessor: "total_item" },
        {
            header: "Total Berat", accessor: "total_berat",
            render: (row) => `${Number(row.total_berat) || 0} gr`,
        },
        {
            header: "Total Modal", accessor: "total_modal",
            render: (row) => HelperFunctions.formatCurrency(Number(row.total_modal) || 0),
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
                        fields={[{ name: "cabang", label: "", type: "dropdown", options: branchOptions, placeholder: "Pilih cabang" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Total Item Dibeli" value={summary.totalItem.toLocaleString("id-ID")} icon={PackageIcon} tone="info" />
                <StatCard label="Total Berat" value={`${summary.totalBerat.toLocaleString("id-ID")} gr`} icon={ScalesIcon} tone="success" />
                <StatCard label="Total Nilai Pembelian" value={HelperFunctions.formatCurrency(summary.totalNilai)} icon={CurrencyCircleDollarIcon} tone="warning" />
            </div>

            {/* Per Kategori/Sub Kategori + Per Karat */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Pembelian per Kategori" subtitle="Distribusi pembelian berdasarkan kategori produk.">
                        <BarChartH data={perKategori} height={180} />
                    </ChartCard>
                    <ChartCard title="Pembelian per Sub Kategori" subtitle="Distribusi pembelian berdasarkan sub kategori produk.">
                        <BarChartH data={perSubKategori} height={180} />
                    </ChartCard>
                </div>
                <ChartCard title="Pembelian per Karat" subtitle="Distribusi pembelian berdasarkan karat emas.">
                    <BarChartH data={perKarat} height={400} />
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

export default ReportPembelian;
