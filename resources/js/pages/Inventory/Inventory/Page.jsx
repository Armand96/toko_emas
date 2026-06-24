import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { PrinterIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import FooterActionBar from "../../../components/FooterActionBar";
import { DetailItemModal, EditItemModal } from "./Modal";
import HelperFunctions from "../../../utils/HelperFunctions";
import InventoryApis from "../../../Services/Inventory.apis";
import LoadingStore from "../../../Store/LoadingStore";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";
import AuthStore from "../../../Store/AuthStore";

const STATUS_CONFIG = {
    Available: { bg: "bg-success-100", text: "text-success-700" },
    Transit:   { bg: "bg-warning-100", text: "text-warning-700" },
    Sold:      { bg: "bg-gray-100",    text: "text-gray-600" },
    Repair:    { bg: "bg-info-100",    text: "text-info-700" },
    Lost:      { bg: "bg-danger-100",  text: "text-danger-700" },
};

const STATUS_OPTIONS = ["AVAILABLE", "TRANSIT", "SOLD", "REPAIR", "LOST"]
    .map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

const toTitleCase = (status) => {
    if (!status) return "";
    return status.charAt(0) + status.slice(1).toLowerCase();
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MasterInventory = () => {
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
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
    const [selectedRows, setSelectedRows]       = useState([]);

    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);
    const ensureCategories = OptionsStore((s) => s.ensureCategories);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const buildRiwayat = (editHistories) => {
        if (!editHistories || editHistories.length === 0) return [];

        const sorted = [...editHistories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return sorted.map((history, idx) => {
            const isFirst = idx === sorted.length - 1;
            const prev = isFirst ? null : sorted[idx + 1];

            if (isFirst) {
                return {
                    title: "Input awal item",
                    actor: history.update_by_user?.name || "-",
                    date: formatDateTime(history.created_at),
                    description: null,
                    changes: [],
                };
            }

            const changes = [];
            if (prev && Number(prev.jual) !== Number(history.jual)) {
                changes.push({ label: "Harga Jual", from: HelperFunctions.formatCurrency(prev.jual), to: HelperFunctions.formatCurrency(history.jual) });
            }
            if (prev && Number(prev.modal) !== Number(history.modal)) {
                changes.push({ label: "Harga Modal", from: HelperFunctions.formatCurrency(prev.modal), to: HelperFunctions.formatCurrency(history.modal) });
            }
            if (prev && Number(prev.berat) !== Number(history.berat)) {
                changes.push({ label: "Berat", from: `${prev.berat}g`, to: `${history.berat}g` });
            }
            if (prev && Number(prev.karat) !== Number(history.karat)) {
                changes.push({ label: "Karat", from: `${prev.karat}K`, to: `${history.karat}K` });
            }
            if (prev && prev.note !== history.note) {
                changes.push({ label: "Keterangan", from: prev.note || "-", to: history.note || "-" });
            }
            if (prev && prev.status !== history.status) {
                changes.push({ label: "Status", from: toTitleCase(prev.status), to: toTitleCase(history.status) });
            }
            if (prev && prev.branch_id !== history.branch_id) {
                const fromBranch = branchOptions.find(b => b.value === prev.branch_id)?.label || "-";
                const toBranch = branchOptions.find(b => b.value === history.branch_id)?.label || "-";
                changes.push({ label: "Cabang", from: fromBranch, to: toBranch });
            }
            if (prev && prev.product_id !== history.product_id) {
                const fromProduct = productOptions.find(p => p.value === prev.product_id)?.label || "-";
                const toProduct = productOptions.find(p => p.value === history.product_id)?.label || "-";
                changes.push({ label: "Produk", from: fromProduct, to: toProduct });
            }

            return {
                title: "Edit item",
                actor: history.update_by_user?.name || "-",
                date: formatDateTime(history.created_at),
                description: changes.length > 0 ? null : "Tidak ada perubahan field",
                changes,
            };
        });
    };

    const mapInventory = (row, editHistories = null) => {
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
            riwayat: editHistories ? buildRiwayat(editHistories) : [],
        };
    };

    const fetchData = async (page = 1, pageSize = 10, kode = "", status = "", kategori = "") => {
        setLoading(true);
        try {
            const params = `?page=${page}&limit=${pageSize}`
                + (kode ? `&search=${kode}` : "")
                + (status ? `&status=${status}` : "")
                + (kategori ? `&category_id=${kategori}` : "")
                + (isKasir() && user?.branch_id ? `&branch_id=${user.branch_id}` : "");

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
            ensureProducts(),
            ensureCategories(),
            ensureBranches(),
        ]).then(([productData, categoryData, branchData]) => {
            setProductOptions(HelperFunctions.formatDropdown(productData, "id", "product_name"));
            setCategoryOptions(HelperFunctions.formatDropdown(categoryData, "id", "category_name"));
            setBranchOptions(HelperFunctions.formatDropdown(branchData, "id", "branch_name"));
            setKategoriFilterOptions(HelperFunctions.formatDropdown(categoryData, "id", "category_name"));
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

    const handleViewDetail = async (row) => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetInventorySingle(row.id);
            const detail = res?.data || res;
            const editHistories = detail?.edit_histories || [];
            setSelectedItem({ ...mapInventory(row, editHistories), ...row });
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            setSelectedItem({ ...mapInventory(row), ...row });
            setShowDetailModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
    };

    const handleEdit = async (row) => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetInventorySingle(row.id);
            const detail = res?.data || res;
            const mapped = mapInventory(detail);
            setFormData({
                ...mapped,
                berat: detail.berat ?? row.berat,
                karat: detail.karat ?? row.karat,
                modal: Number(detail.modal ?? row.modal),
                jual: Number(detail.jual ?? row.jual),
                note: detail.note ?? row.note ?? "",
                no_seri: detail.note ?? row.note ?? "",
                foto: mapped.image,
            });
            setFormErrors({});
            setShowEditModal(true);
        } catch (error) {
            console.error(error);
            setFormData({
                ...mapInventory(row),
                berat: row.berat,
                karat: row.karat,
                modal: Number(row.modal),
                jual: Number(row.jual),
                note: row.note ?? "",
                no_seri: row.note ?? "",
                foto: row.image_path ? `/storage/${row.image_path}` : null,
            });
            setFormErrors({});
            setShowEditModal(true);
        } finally {
            setLoading(false);
        }
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

        if (name === "berat" || name === "karat") {
            const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
            setFormData((prev) => ({ ...prev, [name]: normalized }));
            if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
            return;
        }

        if (name === "jual") {
            setFormData((prev) => ({ ...prev, jual: value }));
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

    const handleSubmitEdit = async () => {
        const newErrors = {};
        if (!formData.product_id) newErrors.product_id = "Produk wajib dipilih";
        if (!formData.berat) newErrors.berat = "Berat wajib diisi";
        if (!formData.karat) newErrors.karat = "Karat wajib diisi";
        if (!formData.jual) newErrors.jual = "Harga jual wajib diisi";

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const body = {
                product_id: formData.product_id,
                berat: Number(formData.berat),
                karat: Number(formData.karat),
                jual: Number(formData.jual),
                serial_number: formData.no_seri || null,
            };
            await InventoryApis.PutInventory(formData.id, body);
            handleCloseEdit();
            fetchData(paramFetch.current_page, paramFetch.per_page, search.kode, filter.status, filter.kategori);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(paramFetch.data.filter(item => item.status === 'AVAILABLE').map(item => item.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleBulkPrint = () => {
        const selected = paramFetch.data.filter(item => selectedRows.includes(item.id));
        if (selected.length === 0) return;
        const barcodes = selected.map(item => item.inventory_code);
        const items = selected.map(item => {
            const product = productOptions.find(p => p.value === item.product_id)?.details;
            return {
                barcode: item.inventory_code,
                label: product?.product_name ?? '',
            };
        });
        HelperFunctions.printBarcode(barcodes, { items });
    };

    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={selectedRows.length > 0 && selectedRows.length === paramFetch.data.filter(item => item.status === 'AVAILABLE').length}
                />
            ),
            accessor: 'checkbox',
            render: (row) => row.status === 'AVAILABLE' ? (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                />
            ) : null,
        },
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
            render: (row) => <span className="text-gray-700">{HelperFunctions.formatCurrency(row.modal)}</span>,
        },
        {
            header: "Jual",
            accessor: "jual",
            render: (row) => <span className="text-gray-700">{HelperFunctions.formatCurrency(row.jual)}</span>,
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
                <ActionButtonGroup>
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewDetail(row)} />
                    {row.status === "AVAILABLE" && can('update', 'inventory.item_inventory') && (
                        <ActionButton variant="edit" onClick={() => handleEdit(row)} />
                    )}
                </ActionButtonGroup>
            ),
        },
    ];

    return (
        <div className={`flex flex-col gap-6 w-full ${selectedRows.length > 0 ? 'pb-24 lg:pb-28' : ''}`}>
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

            <FooterActionBar
                selectedCount={selectedRows.length}
                onClearSelection={() => setSelectedRows([])}
                primaryText={selectedRows.length > 0 ? `Cetak QR Code (${selectedRows.length})` : undefined}
                primaryType="primary"
                primaryIcon={<PrinterIcon size={16} />}
                onPrimaryClick={handleBulkPrint}
            />
        </div>
    );
};

export default MasterInventory;
