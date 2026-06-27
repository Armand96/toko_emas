import { useEffect, useState } from "react";
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
import LoadingStore from "../../../Store/LoadingStore";
import OptionsStore from "../../../Store/OptionsStore";
import ReportApis from "../../../Services/Report.apis";
import StatCard from "./Component/StatCard";
import MiniStatCard from "./Component/MiniStatCard";
import ChartCard from "./Component/ChartCard";
import BarChartH from "./Component/BarChartH";
import DonutChart from "./Component/DonutChart";

const STATUS_TONE = {
    AVAILABLE: "success",
    REPAIR: "primary",
    TRANSIT: "warning",
    LOST: "danger",
    SOLD: "gray",
};

const STATUS_LABEL = {
    AVAILABLE: "Available",
    REPAIR: "In Repair",
    TRANSIT: "Transit",
    LOST: "Lost",
    SOLD: "Sold",
};

const STATUS_OPTIONS = [
    { value: "AVAILABLE", label: "Available" },
    { value: "REPAIR", label: "In Repair" },
    { value: "TRANSIT", label: "Transit" },
    { value: "LOST", label: "Lost" },
    { value: "SOLD", label: "Sold" },
];

const AGING_OPTIONS = [
    { value: "0-30", label: "0-30 Hari" },
    { value: "31-90", label: "31-90 Hari" },
    { value: "91-180", label: "91-180 Hari" },
    { value: ">180", label: ">180 Hari" },
];

const AGING_ORDER = ["0-30 Hari", "31-90 Hari", "91-180 Hari", ">180 Hari"];

const ReportInventory = () => {
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const ensureCategories = OptionsStore((s) => s.ensureCategories);

    const [filter, setFilter] = useState({
        cabang: "",
        kategori: "",
        search: "",
        statusDetail: "AVAILABLE",
        agingDetail: "",
    });

    const [branchOptions, setBranchOptions] = useState([{ value: "", label: "Semua Cabang" }]);
    const [categoryOptions, setCategoryOptions] = useState([{ value: "", label: "Semua Kategori" }]);

    const [summary, setSummary] = useState({
        totalItem: 0, totalBerat: 0, nilaiModal: 0, nilaiJual: 0, margin: 0, marginPct: 0,
    });
    const [statusSecondary, setStatusSecondary] = useState([
        { key: "repair", label: "Item In Repair", value: 0, tone: "primary" },
        { key: "transit", label: "Item Transit", value: 0, tone: "warning" },
        { key: "lost", label: "Item Lost", value: 0, tone: "danger" },
        { key: "sold", label: "Item Sold", value: 0, tone: "gray" },
    ]);

    const [perKategori, setPerKategori] = useState([]);
    const [perSubKategori, setPerSubKategori] = useState([]);
    const [perKarat, setPerKarat] = useState([]);
    const [statusInventory, setStatusInventory] = useState([]);
    const [inventoryAging, setInventoryAging] = useState([]);

    const [detail, setDetail] = useState({ data: [], current_page: 1, total: 0, per_page: 10 });
    const [exporting, setExporting] = useState(false);

    const buildParams = (extra = {}) => {
        const q = new URLSearchParams();
        if (filter.cabang) q.append("branch_id", filter.cabang);
        if (filter.kategori) q.append("category_id", filter.kategori);
        Object.entries(extra).forEach(([k, v]) => {
            if (v !== "" && v !== undefined && v !== null) q.append(k, v);
        });
        return q;
    };

    const fetchCharts = async () => {
        setLoading(true);
        try {
            const params = buildParams().toString();
            const suffix = params ? `?${params}` : "";
            const [summaryRes, distRes, statusAgingRes] = await Promise.all([
                ReportApis.GetInventorySummary(suffix),
                ReportApis.GetInventoryDistribution(suffix),
                ReportApis.GetInventoryStatusAging(suffix),
            ]);

            const totalItem = Number(summaryRes?.total_item_active) || 0;
            const totalBerat = Number(summaryRes?.total_berat_active) || 0;
            const nilaiModal = Number(summaryRes?.total_modal) || 0;
            const nilaiJual = Number(summaryRes?.total_jual) || 0;
            const margin = nilaiJual - nilaiModal;
            const marginPct = nilaiModal > 0 ? ((margin / nilaiModal) * 100).toFixed(1) : 0;

            setSummary({ totalItem, totalBerat, nilaiModal, nilaiJual, margin, marginPct });

            setStatusSecondary([
                { key: "repair", label: "Item In Repair", value: Number(summaryRes?.item_repair) || 0, tone: "primary" },
                { key: "transit", label: "Item Transit", value: Number(summaryRes?.item_transit) || 0, tone: "warning" },
                { key: "lost", label: "Item Lost", value: Number(summaryRes?.item_lost) || 0, tone: "danger" },
                { key: "sold", label: "Item Sold", value: Number(summaryRes?.item_sold) || 0, tone: "gray" },
            ]);

            const category = distRes?.category ?? [];
            const subcategory = distRes?.subcategory ?? [];
            const karat = distRes?.karat ?? [];

            setPerKategori(category.map((r) => ({ label: r.category_name ?? "-", value: Number(r.total_item) || 0 })));
            setPerSubKategori(subcategory.map((r) => ({ label: r.subcategory_name ?? "-", value: Number(r.total_item) || 0 })));
            setPerKarat(karat.map((r) => ({ label: `${r.karat}K`, value: Number(r.total_item) || 0 })));

            const statusArr = statusAgingRes?.status ?? [];
            setStatusInventory(statusArr.map((r) => ({
                label: STATUS_LABEL[r.status] || r.status,
                value: Number(r.total) || 0,
            })));

            const agingArr = statusAgingRes?.aging ?? [];
            const agingMap = {};
            agingArr.forEach((r) => { agingMap[r.aging_group] = Number(r.total) || 0; });
            setInventoryAging(AGING_ORDER.map((g) => ({ label: g, value: agingMap[g] || 0 })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (page = 1, perPage = 10) => {
        setLoading(true);
        try {
            const extra = { page, per_page: perPage };
            if (filter.search) extra.search = filter.search;
            if (filter.statusDetail) extra.status = filter.statusDetail;
            if (filter.agingDetail) extra.aging = filter.agingDetail;
            const params = buildParams(extra);
            const res = await ReportApis.GetInventoryDetail(`?${params.toString()}`);
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
        (async () => {
            try {
                const [branchList, categoryList] = await Promise.all([
                    ensureBranches(),
                    ensureCategories(),
                ]);
                setBranchOptions([
                    { value: "", label: "Semua Cabang" },
                    ...HelperFunctions.formatDropdown(branchList, "id", "branch_name"),
                ]);
                const parentOnly = (Array.isArray(categoryList) ? categoryList : []).filter((c) => !c.parent_id);
                setCategoryOptions([
                    { value: "", label: "Semua Kategori" },
                    ...HelperFunctions.formatDropdown(parentOnly, "id", "category_name"),
                ]);
            } catch (error) {
                console.error(error);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchCharts();
        fetchDetail(1, detail.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.cabang, filter.kategori]);

    useEffect(() => {
        const t = setTimeout(() => fetchDetail(1, detail.per_page), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.search, filter.statusDetail, filter.agingDetail]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const params = {};
            if (filter.cabang) params.branch_id = filter.cabang;
            if (filter.kategori) params.category_id = filter.kategori;
            await ReportApis.ExportInventory(params);
        } catch (error) {
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const onChangePage = (page) => fetchDetail(page, detail.per_page);
    const onChangePageSize = (size) => fetchDetail(1, size);

    const detailColumns = [
        {
            header: "Kode", accessor: "inventory_code",
            render: (row) => <CodeBadge variant="table">{row.inventory_code}</CodeBadge>,
        },
        {
            header: "Produk", accessor: "product",
            render: (row) => {
                const imgSrc = row.image_path ? `/storage/${row.image_path}` : null;
                return (
                    <div className="flex items-center gap-2">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={row.product?.product_name || ""}
                                className="h-8 w-8 flex-shrink-0 rounded-md object-cover bg-gray-100"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "";
                                    e.target.style.display = "none";
                                }}
                            />
                        ) : (
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-warning-50 text-warning-500">
                                <CoinsIcon size={16} weight="fill" />
                            </span>
                        )}
                        <span className="text-gray-900">{row.product?.product_name ?? "-"}</span>
                    </div>
                );
            },
        },
        { header: "Kategori", accessor: "category", render: (row) => row.category?.category_name ?? "-" },
        { header: "Sub Kategori", accessor: "sub_category", render: (row) => row.sub_category?.category_name ?? "-" },
        { header: "Berat", accessor: "berat", render: (row) => `${Number(row.berat) || 0} gr` },
        { header: "Karat", accessor: "karat", render: (row) => `${row.karat} K` },
        { header: "Modal", accessor: "modal", render: (row) => HelperFunctions.formatCurrency(Number(row.modal) || 0) },
        { header: "Jual", accessor: "jual", render: (row) => HelperFunctions.formatCurrency(Number(row.jual) || 0) },
        { header: "Cabang", accessor: "branch", render: (row) => row.branch?.branch_name ?? "-" },
        { header: "Aging", accessor: "aging_days", render: (row) => `${row.aging_days ?? 0} Hari` },
        {
            header: "Status", accessor: "status",
            render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || "gray"}>
                    {STATUS_LABEL[row.status] || row.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="flex w-full flex-col gap-6">
            <HeaderSection
                title="Report Inventory"
                description="Pantau ketersediaan, nilai, dan distribusi item inventory pada setiap cabang."
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-start gap-3">
                <div className="w-full sm:w-[180px]">
                    <InputGroup
                        fields={[{ name: "cabang", label: "", type: "dropdown", options: branchOptions, placeholder: "Semua Cabang" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
                <div className="w-full sm:w-[180px]">
                    <InputGroup
                        fields={[{ name: "kategori", label: "", type: "dropdown", options: categoryOptions, placeholder: "Semua Kategori" }]}
                        formData={filter}
                        cols="1"
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Item Aktif" value={summary.totalItem.toLocaleString("id-ID")} icon={CubeIcon} tone="primary" />
                <StatCard label="Total Berat Aktif" value={`${summary.totalBerat.toLocaleString("id-ID")} gr`} icon={ScalesIcon} tone="warning" />
                <StatCard label="Total Nilai Modal" value={HelperFunctions.formatCurrency(summary.nilaiModal)} icon={CoinsIcon} tone="danger" />
                <StatCard
                    label="Total Nilai Jual"
                    value={HelperFunctions.formatCurrency(summary.nilaiJual)}
                    subLabel={`Margin ${summary.margin >= 0 ? "" : "-"}${HelperFunctions.formatCurrency(Math.abs(summary.margin))} • ${summary.margin >= 0 ? "" : "-"}${Math.abs(summary.marginPct)}%`}
                    icon={TrendUpIcon}
                    tone={summary.margin >= 0 ? "success" : "danger"}
                />
            </div>

            {/* Status sekunder */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statusSecondary.map((s) => (
                    <MiniStatCard key={s.key} label={s.label} value={s.value.toLocaleString("id-ID")} tone={s.tone} />
                ))}
            </div>

            {/* Distribusi kategori/sub + karat */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <ChartCard title="Item per Kategori" subtitle="Distribusi item aktif berdasarkan kategori produk.">
                        <BarChartH data={perKategori} height={180} currency={false} />
                    </ChartCard>
                    <ChartCard title="Item per Sub Kategori" subtitle="Distribusi item aktif berdasarkan sub kategori produk.">
                        <BarChartH data={perSubKategori} height={180} currency={false} />
                    </ChartCard>
                </div>
                <ChartCard title="Item per Karat" subtitle="Item aktif berdasarkan karat emas.">
                    <BarChartH data={perKarat} height={400} currency={false} />
                </ChartCard>
            </div>

            {/* Status inventory + Aging */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Status Inventory" subtitle="Distribusi item berdasarkan status inventory.">
                    <DonutChart
                        data={statusInventory}
                        colors={["#00c951", "#d63384", "#f9a220", "#fb2c36", "#45556c"]}
                        height={320}
                    />
                </ChartCard>
                <ChartCard title="Inventory Aging" subtitle="Distribusi item aktif berdasarkan lama tersimpan di inventory.">
                    <BarChartH data={inventoryAging} height={320} currency={false} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <div className="rounded-lg border border-gray-200 bg-neutral-white p-5">
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
                                fields={[{ name: "statusDetail", label: "", type: "dropdown", options: STATUS_OPTIONS, placeholder: "Semua Status" }]}
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

export default ReportInventory;
