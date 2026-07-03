import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { PrinterIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import CodeBadge from "../../../components/CodeBadge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import FilterBar from "../../../components/FilterBar";
import FooterActionBar from "../../../components/FooterActionBar";
import DetailItemModal from "./DetailItemModal";
import EditItemModal from "./EditItemModal";
import HelperFunctions from "../../../utils/HelperFunctions";
import InventoryApis from "../../../Services/Inventory.apis";
import { showAlert } from "../../../utils/showAlert";
import LoadingStore from "../../../Store/LoadingStore";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";
import AuthStore from "../../../Store/AuthStore";

const STATUS_CONFIG = {
    Available: { bg: "bg-success-100", text: "text-success-700" },
    Reserved:  { bg: "bg-warning-100", text: "text-warning-700" },
    Transit:   { bg: "bg-warning-100", text: "text-warning-700" },
    Sold:      { bg: "bg-gray-100",    text: "text-gray-600" },
    Repair:    { bg: "bg-info-100",    text: "text-info-700" },
    Lost:      { bg: "bg-danger-100",  text: "text-danger-700" },
};

const STATUS_OPTIONS = ["AVAILABLE", "RESERVED", "TRANSIT", "SOLD", "REPAIR", "LOST"]
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
    const [filter, setFilter]         = useState({ status: "", kategori: "", cabang: "" });
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
    const [initialFormData, setInitialFormData] = useState(null);
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

    // Nama + role pengguna yang melakukan perubahan (diambil dari API).
    const buildActor = (history) => {
        const user = history.update_by_user;
        if (!user?.name) return "-";
        const role = user.role?.role_name;
        return role ? `${user.name} (${role})` : user.name;
    };

    // Snapshot nilai awal item saat pertama kali diinput (ditampilkan di entri "Input awal item").
    const buildInitialSnapshot = (history) => {
        const changes = [];
        changes.push({ label: "Harga Jual", to: HelperFunctions.formatCurrency(history.jual) });
        changes.push({ label: "Harga Modal", to: HelperFunctions.formatCurrency(history.modal) });
        changes.push({ label: "Berat", to: `${history.berat}g` });
        changes.push({ label: "Karat", to: `${history.karat}K` });
        changes.push({ label: "Status", to: toTitleCase(history.status) });
        const branch = branchOptions.find(b => b.value === history.branch_id)?.label;
        if (branch) changes.push({ label: "Cabang", to: branch });
        const product = productOptions.find(p => p.value === history.product_id)?.label;
        if (product) changes.push({ label: "Produk", to: product });
        if (history.note) changes.push({ label: "Keterangan", to: history.note });
        if (history.serial_number) changes.push({ label: "No. Seri", to: history.serial_number });
        return changes;
    };

    // edit_histories = snapshot SEBELUM edit (old values).
    // Untuk tahu apa yang berubah di setiap edit, kita bandingkan snapshot
    // dengan state SESUDAH edit tsb: yaitu snapshot berikutnya, atau current
    // inventory data untuk edit terakhir.
    const diffSnapshot = (before, after) => {
        const changes = [];
        if (Number(before.jual) !== Number(after.jual))
            changes.push({ label: "Harga Jual", from: HelperFunctions.formatCurrency(before.jual), to: HelperFunctions.formatCurrency(after.jual) });
        if (Number(before.modal) !== Number(after.modal))
            changes.push({ label: "Harga Modal", from: HelperFunctions.formatCurrency(before.modal), to: HelperFunctions.formatCurrency(after.modal) });
        if (Number(before.berat) !== Number(after.berat))
            changes.push({ label: "Berat", from: `${before.berat}g`, to: `${after.berat}g` });
        if (Number(before.karat) !== Number(after.karat))
            changes.push({ label: "Karat", from: `${before.karat}K`, to: `${after.karat}K` });
        if ((before.note || "") !== (after.note || ""))
            changes.push({ label: "Keterangan", from: before.note || "-", to: after.note || "-" });
        if ((before.serial_number || "") !== (after.serial_number || ""))
            changes.push({ label: "No. Seri", from: before.serial_number || "-", to: after.serial_number || "-" });
        if (before.status !== after.status)
            changes.push({ label: "Status", from: toTitleCase(before.status), to: toTitleCase(after.status) });
        if (before.branch_id !== after.branch_id) {
            changes.push({ label: "Cabang", from: branchOptions.find(b => b.value === before.branch_id)?.label || "-", to: branchOptions.find(b => b.value === after.branch_id)?.label || "-" });
        }
        if (before.product_id !== after.product_id) {
            changes.push({ label: "Produk", from: productOptions.find(p => p.value === before.product_id)?.label || "-", to: productOptions.find(p => p.value === after.product_id)?.label || "-" });
        }
        return changes;
    };

    const REMOVE_JENIS_LABEL = { HILANG: "Hilang", REPAIR: "Repair" };

    // Riwayat aksi non-edit: storing (input awal dari pembelian), transfer, remove, sold.
    // Sumbernya bukan editHistories (yang hanya tercatat saat edit manual), melainkan
    // tabel transaksi terkait (pembelian, transfer_item, remove_item, t_sales) yang
    // di-join lewat inventory_code dari endpoint detail.
    // Catatan: transfer_items/remove_items hanya simpan 1 kolom status per header (di-overwrite
    // tiap transisi APPROVAL->DISETUJUI->RETURN dst), jadi tiap row transfer/remove di sini hanya
    // bisa menghasilkan SATU event (state akhirnya) -- bukan satu event per transisi status.
    const buildActionEvents = (detail) => {
        const events = [];

        if (detail.pembelian) {
            const p = detail.pembelian;
            events.push({
                title: "Storing item",
                actor: buildActor({ update_by_user: p.user }),
                rawDate: p.updated_at,
                date: formatDateTime(p.updated_at),
                description: "Input awal item dari pembelian",
            });
        }

        (detail.transfer_details || []).forEach((d) => {
            const h = d.header;
            if (!h) return;
            const fromBranch = h.branch_source?.branch_name || "-";
            const toBranch = h.branch_dest?.branch_name || "-";
            const isFinal = ["DISETUJUI", "DITOLAK", "DIBATALKAN"].includes(h.status);
            const rawDate = isFinal ? h.updated_at : h.created_at;
            events.push({
                title: "Transfer item",
                actor: buildActor({ update_by_user: h.user }),
                rawDate,
                date: formatDateTime(rawDate),
                description: isFinal
                    ? `Transfer item dari cabang ${fromBranch} ke ${toBranch} (${toTitleCase(h.status)})`
                    : `Pengajuan transfer item dari cabang ${fromBranch} ke ${toBranch}`,
            });
        });

        (detail.remove_details || []).forEach((d) => {
            const h = d.header;
            if (!h) return;
            // Header status = source of truth (changeApproval header-level dipakai di hampir semua kasus).
            // d.status (RemoveItemDetail) hanya ter-update lewat endpoint approval per-detail terpisah,
            // jadi sering basi (stuck "APPROVAL") walau header sudah final.
            const status = h.status;
            const jenisLabel = REMOVE_JENIS_LABEL[h.jenis] || h.jenis;
            const isFinal = ["DISETUJUI", "DITOLAK", "DIBATALKAN", "RETURN"].includes(status);
            const rawDate = isFinal ? (d.updated_at || h.updated_at) : h.created_at;
            events.push({
                title: status === "RETURN" ? "Storing item" : "Remove item",
                actor: buildActor({ update_by_user: h.user }),
                rawDate,
                date: formatDateTime(rawDate),
                description: status === "RETURN"
                    ? "Update kembali status item inventory ke Available"
                    : isFinal
                        ? `Remove item dengan jenis ${jenisLabel} (${toTitleCase(status)})`
                        : `Pengajuan remove item dengan jenis ${jenisLabel}`,
            });
        });

        if (detail.sales_detail?.header) {
            const h = detail.sales_detail.header;
            if (h.approval_status === "CETAK KWITANSI" || h.approval_status === "SELESAI") {
                events.push({
                    title: "Sold item",
                    actor: buildActor({ update_by_user: h.user }),
                    rawDate: h.updated_at,
                    date: formatDateTime(h.updated_at),
                    description: `Item terjual pada order ${h.order_id}`,
                });
            }
        }

        return events;
    };

    const buildRiwayat = (editHistories, currentInventory, detail = null) => {
        const result = [];

        if (editHistories && editHistories.length > 0) {
            const sorted = [...editHistories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            sorted.forEach((history, idx) => {
                const isOldest = idx === sorted.length - 1;

                // Setiap edit_history = snapshot SEBELUM edit.
                // Perubahan = diff(snapshot, state sesudahnya).
                const after = idx === 0 ? currentInventory : sorted[idx - 1];
                const changes = after ? diffSnapshot(history, after) : [];

                result.push({
                    title: "Edit item",
                    actor: buildActor(history),
                    rawDate: history.created_at,
                    date: formatDateTime(history.created_at),
                    description: changes.length > 0 ? null : "Tidak ada perubahan field",
                    changes,
                });

                // Entry paling lama dari editHistories = "Input awal item" (snapshot nilai awal),
                // hanya dipakai sebagai fallback kalau tidak ada data pembelian di detail.
                if (isOldest && !detail?.pembelian) {
                    result.push({
                        title: "Input awal item",
                        actor: buildActor(history),
                        rawDate: history.created_at,
                        date: formatDateTime(history.created_at),
                        description: null,
                        changes: buildInitialSnapshot(history),
                        initial: true,
                    });
                }
            });
        }

        if (detail) {
            result.push(...buildActionEvents(detail));
        }

        return result.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    };

    const mapInventory = (row, editHistories = null, currentData = null, detail = null) => {
        const product  = row.product || productOptions.find((p) => p.value === row.product_id)?.details;
        const branch   = row.branch || branchOptions.find((b) => b.value === row.branch_id)?.details;

        const kategori = row.sub_category
            ? (row.category?.category_name || '-')
            : (row.category?.parent?.category_name || row.category?.category_name || '-');
        const subKategori = row.sub_category?.category_name || '';

        return {
            id: row.id,
            kode: row.inventory_code,
            inventory_code: row.inventory_code,
            produk: product?.product_name || "-",
            kategori,
            sub_kategori: subKategori,
            berat: `${row.berat}g`,
            karat: `${row.karat}K`,
            modal: Number(row.modal),
            jual: Number(row.jual),
            cabang: branch?.branch_name || "-",
            status: toTitleCase(row.status),
            no_seri: row.serial_number || "",
            keterangan: row.note || "",
            image: row.image_path ? `/storage/${row.image_path}` : null,
            product_id: row.product_id,
            branch_id: row.branch_id,
            category_id: row.category_id,
            riwayat: detail ? buildRiwayat(editHistories, currentData || row, detail) : [],
        };
    };

    const fetchData = async (page = 1, pageSize = 10, kode = "", status = "", kategori = "", cabang = "") => {
        setLoading(true);
        try {
            const effectiveBranch = isKasir() && user?.branch_id ? user.branch_id : cabang;
            const params = `?page=${page}&limit=${pageSize}`
                + (kode ? `&search=${kode}` : "")
                + (status ? `&status=${status}` : "")
                + (kategori ? `&category_id=${kategori}` : "")
                + (effectiveBranch ? `&branch_id=${effectiveBranch}` : "");

            const res = await InventoryApis.GetInventory(params);
            if (res?.data) {
                res.data = [...res.data].sort((a, b) => (a.inventory_code || '').localeCompare(b.inventory_code || ''));
            }
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
            setKategoriFilterOptions(HelperFunctions.formatDropdown(
                categoryData.filter((c) => !c.parent_id), "id", "category_name"
            ));
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
        fetchData(1, paramFetch.per_page, search.kode, newFilter.status, newFilter.kategori, newFilter.cabang);
    };

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, search.kode, filter.status, filter.kategori, filter.cabang);
        }
    }, [searchBounce]);

    const onChangePage     = (page)     => fetchData(page, paramFetch.per_page, search.kode, filter.status, filter.kategori, filter.cabang);
    const onChangePageSize = (pageSize) => fetchData(1,    pageSize,            search.kode, filter.status, filter.kategori, filter.cabang);

    const handleViewDetail = async (row) => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetInventorySingle(row.id);
            const detail = res?.data || res;
            const editHistories = detail?.edit_histories || [];
            setSelectedItem({ ...row, ...mapInventory(row, editHistories, detail, detail) });
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            setSelectedItem({ ...row, ...mapInventory(row) });
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
            const fd = {
                ...mapped,
                berat: detail.berat ?? row.berat,
                karat: detail.karat ?? row.karat,
                modal: Number(detail.modal ?? row.modal),
                jual: Number(detail.jual ?? row.jual),
                note: detail.note ?? row.note ?? "",
                no_seri: detail.serial_number ?? row.serial_number ?? "",
                foto: mapped.image,
            };
            setFormData(fd);
            setInitialFormData(fd);
            setFormErrors({});
            setShowEditModal(true);
        } catch (error) {
            console.error(error);
            const fd = {
                ...mapInventory(row),
                berat: row.berat,
                karat: row.karat,
                modal: Number(row.modal),
                jual: Number(row.jual),
                note: row.note ?? "",
                no_seri: row.serial_number ?? "",
                foto: row.image_path ? `/storage/${row.image_path}` : null,
            };
            setFormData(fd);
            setInitialFormData(fd);
            setFormErrors({});
            setShowEditModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseEdit = () => {
        setShowEditModal(false);
        setFormData(null);
        setInitialFormData(null);
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
            showAlert({ icon: 'success', isAutoClose: true, title: 'Berhasil Diperbarui', message: 'Data item inventory berhasil disimpan.' });
            handleCloseEdit();
            fetchData(paramFetch.current_page, paramFetch.per_page, search.kode, filter.status, filter.kategori, filter.cabang);
        } catch (error) {
            showAlert({ icon: 'error', title: 'Gagal Menyimpan', message: 'Terjadi kesalahan saat menyimpan data.' });
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
            render: (row) => <CodeBadge variant="table">{row.inventory_code}</CodeBadge>,
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
                if (row.sub_category) return row.category?.category_name || '-';
                return row.category?.parent?.category_name || row.category?.category_name || '-';
            },
        },
        {
            header: "Sub Kategori",
            accessor: "sub_kategori",
            render: (row) => row.sub_category?.category_name || '-',
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
                const toneMap = { Available: 'success', Reserved: 'warning', Transit: 'warning', Sold: 'gray', Repair: 'info', Lost: 'danger' };
                return <Badge tone={toneMap[status] || 'gray'}>{status}</Badge>;
            },
        },
        {
            header: "Aksi",
            accessor: "aksi",
            render: (row) => (
                <ActionButtonGroup>
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewDetail(row)} />
                    {row.status === "AVAILABLE" && can('update') && (
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
            <FilterBar>
                <FilterBar.Search>
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
                </FilterBar.Search>
                <FilterBar.Item>
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
                </FilterBar.Item>
                <FilterBar.Item>
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
                </FilterBar.Item>
                {!isKasir() && (
                    <FilterBar.Item>
                        <InputGroup
                            fields={[{
                                name: "cabang",
                                label: "",
                                type: "dropdown",
                                placeholder: "Pilih cabang",
                                options: branchOptions,
                            }]}
                            formData={filter}
                            cols="1"
                            onChange={handleFilterChange}
                        />
                    </FilterBar.Item>
                )}
            </FilterBar>

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
                initialFormData={initialFormData}
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
