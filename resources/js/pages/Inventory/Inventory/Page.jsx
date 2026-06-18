import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import { DetailItemModal, EditItemModal } from "./Modal";
import HelperFunctions from "../../../utils/HelperFunctions";
import InventoryApis from "../../../Services/Inventory.apis";
import BranchApis from "../../../Services/Branch.apis";
import LoadingStore from "../../../Store/LoadingStore";

const STATUS_CONFIG = {
    Available: { bg: "bg-success-100", text: "text-success-700" },
    Transit:   { bg: "bg-warning-100", text: "text-warning-700" },
    Sold:      { bg: "bg-gray-100",    text: "text-gray-600" },
    Repair:    { bg: "bg-info-100",    text: "text-info-700" },
    Lost:      { bg: "bg-danger-100",  text: "text-danger-700" },
};

const STATUS_OPTIONS = ["AVAILABLE", "TRANSIT", "SOLD", "REPAIR", "LOST"]
    .map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

const formatRupiah = (num) => "Rp " + Number(num || 0).toLocaleString("id-ID");

const toTitleCase = (status) => {
    if (!status) return "";
    return status.charAt(0) + status.slice(1).toLowerCase();
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MasterInventory = () => {
    const [paramFetch, setParamFetch] = useState({ data: [], current_page: 1, total: 0, per_page: 10 });
    const [search, setSearch]         = useState({ kode: "" });
    const [filter, setFilter]         = useState({ status: "", kategori: "" });
    const [firstLoading, setFirstLoading] = useState(false);
    const [searchBounce] = useDebounce(search, 500);

    const [productOptions, setProductOptions]   = useState([]);
    const [branchOptions, setBranchOptions]     = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [kategoriFilterOptions, setKategoriFilterOptions] = useState([]);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal]     = useState(false);
    const [selectedItem, setSelectedItem]       = useState(null);
    const [formData, setFormData]               = useState(null);
    const [formErrors, setFormErrors]           = useState({});

    const setLoading = LoadingStore((state) => state.setLoading);

    const mapInventory = (row) => {
        const product  = productOptions.find((p) => p.value === row.product_id)?.details;
        const branch   = branchOptions.find((b) => b.value === row.branch_id)?.details;
        const category = categoryOptions.find((c) => c.value === row.category_id)?.details;

        const isSubCategory = category?.parent_id !== null && category?.parent_id !== undefined;
        const parentCategory = isSubCategory
            ? categoryOptions.find((c) => c.value === category.parent_id)?.details
            : category;

        return {
            id: row.id,
            kode: row.inventory_code,
            inventory_code: row.inventory_code,
            produk: product?.product_name || "-",
            kategori: parentCategory?.category_name || "-",
            sub_kategori: isSubCategory ? category?.category_name : "",
            berat: `${row.berat}g`,
            karat: `${row.karat}K`,
            modal: Number(row.modal),
            jual: Number(row.jual),
            cabang: branch?.branch_name || "-",
            status: toTitleCase(row.status),
            no_seri: row.note || "",
            keterangan: row.note || "",
            image: row.image_path ? `/storage/${row.image_path}` : null,
            product_id: row.product_id,
            branch_id: row.branch_id,
            category_id: row.category_id,
            riwayat: [],
        };
    };

    const fetchData = async (page = 1, pageSize = 10, kode = "", status = "", kategori = "") => {
        setLoading(true);
        try {
            const params = `?page=${page}&limit=${pageSize}`
                + (kode ? `&search=${kode}` : "")
                + (status ? `&status=${status}` : "")
                + (kategori ? `&category_id=${kategori}` : "");

            const res = await InventoryApis.GetInventory(params);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            InventoryApis.GetProducts("?limit=1000"),
            InventoryApis.GetCategories("?limit=1000"),
            BranchApis.GetBranch("?limit=1000"),
        ]).then(([productRes, categoryRes, branchRes]) => {
            setProductOptions(HelperFunctions.formatDropdown(productRes.data, "id", "product_name"));
            setCategoryOptions(HelperFunctions.formatDropdown(categoryRes.data, "id", "category_name"));
            setBranchOptions(HelperFunctions.formatDropdown(branchRes.data, "id", "branch_name"));
            setKategoriFilterOptions(HelperFunctions.formatDropdown(categoryRes.data, "id", "category_name"));
        }).catch((error) => {
            console.error("Error fetching options:", error);
        }).finally(() => {
            setLoading(false);
            fetchData();
        });
    }, []);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilter = { ...filter, [name]: value };
        setFilter(newFilter);
        fetchData(1, paramFetch.per_page, search.kode, newFilter.status, newFilter.kategori);
    };

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, search.kode, filter.status, filter.kategori);
        }
    }, [searchBounce]);

    const onChangePage     = (page)     => fetchData(page, paramFetch.per_page, search.kode, filter.status, filter.kategori);
    const onChangePageSize = (pageSize) => fetchData(1,    pageSize,            search.kode, filter.status, filter.kategori);

    const handleViewDetail = (row) => {
        setSelectedItem({...mapInventory(row), ...row});
        setShowDetailModal(true);
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
    };

    const handleEdit = (row) => {
        const mapped = mapInventory(row);
        setFormData({ ...mapped, foto: mapped.image });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleCloseEdit = () => {
        setShowEditModal(false);
        setFormData(null);
        setFormErrors({});
    };

    const handleEditChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "foto") {
            const file = files ? files[0] : value;
            setFormData((prev) => ({ ...prev, foto: file ?? null }));
            return;
        }

        if (name === "jual") {
            const raw = HelperFunctions.unformatNumberInput(value);
            setFormData((prev) => ({ ...prev, jual: raw }));
            if (formErrors.jual) setFormErrors((prev) => ({ ...prev, jual: "" }));
            return;
        }

        if (name === "product_id") {
            const found = productOptions.find((p) => p.value === value);
            setFormData((prev) => ({ ...prev, product_id: value, produk: found?.label || prev.produk }));
            if (formErrors.product_id) setFormErrors((prev) => ({ ...prev, product_id: "" }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSubmitEdit = () => {
        const newErrors = {};
        if (!formData.product_id) newErrors.product_id = "Produk wajib dipilih";
        if (!formData.berat) newErrors.berat = "Berat wajib diisi";
        if (!formData.karat) newErrors.karat = "Karat wajib diisi";
        if (!formData.jual) newErrors.jual = "Harga jual wajib diisi";

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        // TODO: kirim ke API saat endpoint update inventory sudah ready
        handleCloseEdit();
    };

    const columns = [
        {
            header: "Kode",
            accessor: "barcode",
            render: (row) => (
                <span className="text-gray-700 text-sm">{row.inventory_code}</span>
            ),
        },
        {
            header: "Produk",
            accessor: "produk",
            render: (row) => {
                const product = productOptions.find((p) => p.value === row.product_id)?.details;
                return (
                    <div className="flex items-center gap-2">
                        <img
                            src={row.image_path ? `/storage/${row.image_path}` : ""}
                            alt={product?.product_name || ""}
                            className="w-8 h-8 rounded object-cover flex-shrink-0 bg-gray-100"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="text-gray-900">{product?.product_name || "-"}</span>
                    </div>
                );
            },
        },
        {
            header: "Kategori",
            accessor: "kategori",
            render: (row) => {
                const category = categoryOptions.find((c) => c.value === row.category_id)?.details;
                const isSubCategory = category?.parent_id !== null && category?.parent_id !== undefined;
                const parentCategory = isSubCategory
                    ? categoryOptions.find((c) => c.value === category.parent_id)?.details
                    : category;
                return parentCategory?.category_name || "-";
            },
        },
        {
            header: "Sub Kategori",
            accessor: "sub_kategori",
            render: (row) => {
                const category = categoryOptions.find((c) => c.value === row.category_id)?.details;
                const isSubCategory = category?.parent_id !== null && category?.parent_id !== undefined;
                return isSubCategory ? category?.category_name : "-";
            },
        },
        { header: "Berat", accessor: "berat", render: (row) => `${row.berat}g` },
        { header: "Karat", accessor: "karat", render: (row) => `${row.karat}K` },
        {
            header: "Modal",
            accessor: "modal",
            render: (row) => <span className="text-gray-700">{formatRupiah(row.modal)}</span>,
        },
        {
            header: "Jual",
            accessor: "jual",
            render: (row) => <span className="text-gray-700">{formatRupiah(row.jual)}</span>,
        },
        {
            header: "Cabang",
            accessor: "cabang",
            render: (row) => branchOptions.find((b) => b.value === row.branch_id)?.label || "-",
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => {
                const status = toTitleCase(row.status);
                const cfg = STATUS_CONFIG[status] || { bg: "bg-gray-100", text: "text-gray-600" };
                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            header: "Aksi",
            accessor: "aksi",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleViewDetail(row)}
                        className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={18} />
                    </button>
                    {row.status === "AVAILABLE" && (
                        <button
                            onClick={() => handleEdit(row)}
                            className="p-1.5 btn-outline hover:bg-warning-50 rounded-md cursor-pointer"
                            title="Edit"
                        >
                            <PencilSimpleLineIcon size={18} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Item Inventory"
                description="List item inventory untuk tracking status stok dan informasi detail setiap item."
            />

            {/* Filter row */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{
                            name: "kode",
                            label: "",
                            type: "search",
                            placeholder: "Cari kode/nama/berat/karat...",
                        }]}
                        formData={search}
                        cols="1"
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="w-[160px]">
                    <InputGroup
                        fields={[{
                            name: "status",
                            label: "",
                            type: "dropdown",
                            placeholder: "Pilih status",
                            options: STATUS_OPTIONS,
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="w-[170px]">
                    <InputGroup
                        fields={[{
                            name: "kategori",
                            label: "",
                            type: "dropdown",
                            placeholder: "Pilih kategori",
                            options: kategoriFilterOptions,
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                onPageChange={onChangePage}
                onPageSizeChange={onChangePageSize}
                total={paramFetch.total}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
            />

            <DetailItemModal
                isOpen={showDetailModal}
                onClose={handleCloseDetail}
                item={selectedItem}
            />

            <EditItemModal
                isOpen={showEditModal}
                onClose={handleCloseEdit}
                formData={formData}
                errors={formErrors}
                onChange={handleEditChange}
                onSubmit={handleSubmitEdit}
                productOptions={productOptions}
                branchOptions={branchOptions}
            />
        </div>
    );
};

export default MasterInventory;
