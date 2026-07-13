import { useEffect, useState } from "react";
import { PlusCircleIcon, PrinterIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import { useDebounce } from "use-debounce";

import { useQueryParams } from "../../../utils/useQueryParams";
import HeaderSection from "../../../components/HeaderSection";
import FilterBar from "../../../components/FilterBar";
import Table from "../../../components/Table/Table";
import CodeBadge from "../../../components/CodeBadge";
import FooterActionBar from "../../../components/FooterActionBar";
import ModalView from "./modalView";

import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import InventoryApis from "../../../Services/Inventory.apis";
import { showAlert } from "../../../utils/showAlert";
import PermissionStore from "../../../Store/PermissionStore";
import OptionsStore from "../../../Store/OptionsStore";
import AuthStore from "../../../Store/AuthStore";
import dayjs from "dayjs";

const MainPembelian = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const ensureCategories = OptionsStore((s) => s.ensureCategories);
    const ensureUsers = OptionsStore((s) => s.ensureUsers);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [userMap, setUserMap] = useState({});

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });
    const [{ search: urlSearch, status: urlStatus, category_id: urlCategoryId, branch_id: urlBranchId, page: urlPage, per_page: urlPerPage }, setQuery] = useQueryParams({
        search: "", status: "", category_id: "", branch_id: "", page: 1, per_page: 10,
    });
    const [search, setSearch] = useState({ search: urlSearch, status: urlStatus, category_id: urlCategoryId, branch_id: urlBranchId });
    const [searchBounce] = useDebounce(search, 500);
    const [firstLoading, setFirstLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page, per_page: pageSize });
            if (params.search) query.append('product_name', params.search);
            if (params.status) query.append('status', params.status);
            if (params.category_id) query.append('category_id', params.category_id);
            if (isKasir() && user?.branch_id) query.append('branch_id', user.branch_id);
            else if (params.branch_id) query.append('branch_id', params.branch_id);

            const res = await InventoryApis.GetPembelian(`?${query.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Buka detail: tembak endpoint single agar relasi lengkap (termasuk user pengaju).
    const handleViewDetail = async (row) => {
        setSelectedData(row);   // tampilkan cepat dari data list dulu
        setIsModalOpen(true);
        try {
            setLoading(true);
            const detail = await InventoryApis.GetPembelianSingle(row.id);
            if (detail) setSelectedData(detail);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(urlPage, urlPerPage, { search: urlSearch, status: urlStatus, category_id: urlCategoryId, branch_id: urlBranchId });
        ensureCategories()
            .then((data) => setCategoryOptions(HelperFunctions.formatDropdown(data, "id", "category_name")))
            .catch((err) => console.error(err));
        ensureUsers()
            .then((data) => setUserMap(Object.fromEntries((data || []).map((u) => [u.id, u.name]))))
            .catch((err) => console.error(err));
        if (!isKasir()) {
            ensureBranches()
                .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")))
                .catch((err) => console.error(err));
        }
    }, []);

    useEffect(() => {
        if (firstLoading) {
            setQuery({ search: searchBounce.search, status: searchBounce.status, category_id: searchBounce.category_id, branch_id: searchBounce.branch_id, page: 1 });
            fetchData(1, paramFetch.per_page, search);
        }
    }, [searchBounce]);

    const handleCancel = (evt) => {
        confirmCancel([evt.id]);
    }

    const confirmCancel = (ids) => {
        showAlert({
            icon: 'warning',
            isAutoClose: false,
            title: 'Batalkan Transaksi Pembelian',
            message: "Apakah Anda yakin ingin membatalkan transaksi pembelian ini? Transaksi yang dibatalkan tidak dapat diproses kembali.",
            confirmText: "Lanjut Batalkan",
            cancelText: "Batal"
        }).then((res) => {
            if (res.confirmed) {
                InventoryApis.updatePembelian({
                    status: "DIBATALKAN",
                    pembelian_ids: ids
                }).then((res) => {
                    setSelectedRows([]);
                    fetchData(paramFetch.current_page, paramFetch.per_page, search);
                    showAlert({
                        icon: 'success',
                        isAutoClose: false,
                        title: 'Berhasil Dibatalkan',
                        message: " Transaksi pembelian telah dibatalkan",
                    })
                })
            }
        })
    }

    const selectableStatuses = ['APPROVAL', 'DISETUJUI'];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const ids = paramFetch.data
                .filter(item => selectableStatuses.includes(item.status))
                .map(item => item.id);
            setSelectedRows(ids);
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const selectedItems = paramFetch.data.filter(item => selectedRows.includes(item.id));
    const hasApproval = selectedItems.some(item => item.status === 'APPROVAL');
    const approvedItems = selectedItems.filter(item => item.status === 'DISETUJUI');

    const handleBulkCancel = () => {
        const approvalIds = selectedItems.filter(item => item.status === 'APPROVAL').map(item => item.id);
        if (approvalIds.length === 0) return;
        confirmCancel(approvalIds);
    };

    const handleBulkPrint = () => {
        if (approvedItems.length === 0) return;
        const barcodes = approvedItems.map(item => item.barcode);
        const items = approvedItems.map(item => ({
            barcode: item.barcode,
            label: item.product?.product_name ?? item.product?.name ?? '',
            berat: item.berat,
            karat: item.karat,
        }));
        HelperFunctions.printBarcode(barcodes, { items });
    };

    const selectableCount = paramFetch.data.filter(item => selectableStatuses.includes(item.status)).length;

    const columns = [
        {
            header: isKasir() && selectableCount > 0 ? (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={selectedRows.length > 0 && selectedRows.length === selectableCount}
                />
            ) : "",
            accessor: 'checkbox',
            render: (row) => isKasir() && selectableStatuses.includes(row.status) ? (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                />
            ) : null
        },
        { header: "Tanggal", accessor: "tanggal", render: (row) => row.tanggal ?? dayjs(row.created_at).format("DD/MM/YYYY") ?? "-" },
        { header: "Batch", accessor: "batch" },
        {
            header: "Kode",
            accessor: "barcode",
            render: (row) => (
                <CodeBadge variant="table">{row.inventory_code || "-"}</CodeBadge>
            ),
        },
        {
            header: "Produk",
            accessor: "produk",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <img
                        src={row.image_path ? `/storage/${row.image_path}` : ""}
                        alt={row.product?.name ?? row.product?.product_name ?? ""}
                        className="w-8 h-8 rounded object-cover flex-shrink-0 bg-gray-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-gray-900">{row.product?.name ?? row.product?.product_name ?? "-"}</span>
                </div>
            ),
        },
        {
            header: "Kategori",
            accessor: "category",
            render: (row) => {
                if (row.subcategory) return row.category?.category_name || '-';
                return row.category?.parent?.category_name || row.category?.category_name || '-';
            },
        },
        {
            header: "Sub Kategori",
            accessor: "sub_kategori",
            render: (row) => row.subcategory?.category_name || '-',
        },

        { header: "Berat", accessor: "berat", render: (row) => (row.berat ? `${row.berat} g` : "-") },
        { header: "Karat", accessor: "karat", render: (row) => (row.karat ? `${row.karat}K` : "-") },
        {
            header: "Modal",
            accessor: "modal",
            render: (row) => HelperFunctions.formatCurrency(row.modal || 0),
        },
        {
            header: "Jual",
            accessor: "jual",
            render: (row) => row.jual > 0 ? HelperFunctions.formatCurrency(row.jual) : "-",
        },
        {
            header: "Cabang",
            accessor: "cabang",
            render: (row) => row.branch?.branch_name ?? row.cabang ?? "-",
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const statusMap = {
                    "DISETUJUI": { label: 'Disetujui', tone: 'success' },
                    "DITOLAK": { label: 'Ditolak', tone: 'danger' },
                    "DIBATALKAN": { label: 'Dibatalkan', tone: 'danger' },
                    "APPROVAL": { label: 'Approval', tone: 'warning' }
                };

                const status = statusMap[row.status] || { label: 'Unknown', tone: 'gray' };

                return <Badge tone={status.tone}>{status.label}</Badge>;
            }
        },
        {
            header: "Aksi",
            accessor: "aksi",
            render: (row) => (
                <ActionButtonGroup>
                    {["APPROVAL"].includes(row?.status) && can('delete') && isKasir() && (
                        <ActionButton variant="cancel" title="Batalkan" onClick={() => handleCancel(row)} />
                    )}
                    <ActionButton
                        variant="view"
                        title="Lihat Detail"
                        onClick={() => handleViewDetail(row)}
                    />
                    {row?.status === "DISETUJUI" && (
                        <ActionButton
                            variant="print"
                            title="Cetak QR Code"
                            onClick={() => HelperFunctions.printBarcode(row.inventory_code, { label: row.product?.product_name ?? row.product?.name, berat: row.berat, karat: row.karat })}
                        />
                    )}
                </ActionButtonGroup>
            ),
        },
    ];

    const onChangePage = (page) => {
        setQuery({ page, per_page: paramFetch.per_page });
        fetchData(page, paramFetch.per_page, search);
    };

    const onChangePageSize = (pageSize) => {
        setQuery({ page: 1, per_page: pageSize });
        fetchData(1, pageSize, search);
    };

    return (
        <div className={`flex flex-col gap-6 w-full relative min-h-full ${selectedRows.length > 0 ? 'pb-24 lg:pb-28' : ''}`}>
            <HeaderSection
                title="Pembelian"
                description="Catat dan kelola pembelian barang sebelum masuk ke inventory aktif"
                icon={PlusCircleIcon}
                onClick={can('create') ? () => setCurentState && setCurentState("form") : undefined}
                textButton="Tambah Pembelian"
            />

            <FilterBar
                value={search}
                onChange={setSearch}
                fields={[
                    { name: "search", type: "search", placeholder: "Cari produk..." },
                    {
                        name: 'status', type: 'dropdown', placeholder: 'Pilih status', options: [
                            { value: 'APPROVAL', label: 'Approval' },
                            { value: 'DISETUJUI', label: 'Disetujui' },
                            { value: 'DITOLAK', label: 'Ditolak' },
                            { value: 'DIBATALKAN', label: 'Dibatalkan' },
                        ]
                    },
                    { name: 'category_id', type: 'dropdown', placeholder: 'Pilih kategori', options: categoryOptions.filter((c) => !c.details?.parent_id) },
                    !isKasir() && { name: 'branch_id', type: 'dropdown', placeholder: 'Pilih cabang', options: branchOptions },
                ]}
            />

            <Table
                columns={columns}
                data={paramFetch.data}
                total={paramFetch.total}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                onPageChange={onChangePage}

                onPageSizeChange={onChangePageSize}
            />

            <ModalView
                isOpen={isModalOpen}

                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedData(null);
                }}
                data={selectedData ? {
                    ...selectedData,
                    user: selectedData.user ?? (userMap[selectedData.created_by]
                        ? { name: userMap[selectedData.created_by] }
                        : null),
                    created_by_name: userMap[selectedData.created_by] || selectedData.user?.name || '-',
                } : null}
            />

            <div className="w-3/6 relative z-60">
                <FooterActionBar
                    selectedCount={selectedRows.length}
                    onClearSelection={() => setSelectedRows([])}
                    primaryText={approvedItems.length > 0 ? `Cetak QR Code (${approvedItems.length})` : undefined}
                    primaryType="primary"

                    primaryIcon={<PrinterIcon size={16} />}
                    onPrimaryClick={handleBulkPrint}
                    secondaryText={hasApproval ? "Batalkan Pengajuan" : undefined}
                    secondaryType="danger"
                    onSecondaryClick={handleBulkCancel}
                />
            </div>
        </div>
    );
};

export default MainPembelian;
