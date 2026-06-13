import { useState, useEffect } from "react";
import { PackageIcon, EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import { DetailItemModal, EditItemModal } from "./Modal";
import HelperFunctions from "../../../utils/HelperFunctions";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const DUMMY_ITEMS = [
    {
        id: 1, kode: "CIN-000006-002", produk: "Cincin Flower", kategori: "Perhiasan", sub_kategori: "Cincin",
        berat: "5.20g", karat: "22K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Available",
        no_seri: "", keterangan: "Kalung rantai diameter 10cm dengan motif bunga mawar",
        image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop",
        product_id: 1, branch_id: 1,
        riwayat: [
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    {
        id: 2, kode: "KAL-000006-001", produk: "Kalung Italy Rantai", kategori: "Perhiasan", sub_kategori: "Kalung",
        berat: "8.50g", karat: "18K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Available",
        no_seri: "", keterangan: "",
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop",
        product_id: 2, branch_id: 1,
        riwayat: [
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    {
        id: 3, kode: "LGM-000006-001", produk: "LM ANTAM", kategori: "Perhiasan", sub_kategori: "Kalung",
        berat: "10gr", karat: "24K", modal: 25460000, jual: 26440000, cabang: "Blok M 1", status: "Available",
        no_seri: "BBBHWF09234793", keterangan: "Kalung rantai diameter 10cm dengan motif bunga mawar melati semuanya indah",
        image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200&h=200&fit=crop",
        product_id: 3, branch_id: 1,
        riwayat: [
            { title: "Storing item", actor: "Yanuar", date: "21 Mei 2026, 12:00", description: "Update kembali status item inventory ke Available" },
            { title: "Remove item", actor: "Yanuar", date: "21 Mei 2026, 12:00", description: "Remove item dengan jenis Repair" },
            {
                title: "Edit item", actor: "Ramdan", date: "21 Mei 2026, 12:00",
                changes: [
                    { label: "Harga Jual", from: "Rp 6.400.000", to: "Rp 6.440.000" },
                    { label: "Berat", from: "9.40g", to: "9.50g" },
                    { label: "Karat", from: "17K", to: "18K" },
                    { label: "Keterangan", from: "Kalung rantai diameter 10cm dengan motif kupu-kupu", to: "Kalung rantai diameter 10cm dengan motif bunga mawar melati semuanya indah" },
                ],
            },
            { title: "Transfer item", actor: "Yanuar", date: "21 Mei 2026, 12:00", description: "Transfer item dari cabang Blok M 1 ke Blok M 2" },
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    {
        id: 4, kode: "ANT-000006-001", produk: "Anting Mutiara", kategori: "Perhiasan", sub_kategori: "Anting",
        berat: "5g", karat: "22K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Sold",
        no_seri: "", keterangan: "",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop",
        product_id: 4, branch_id: 1,
        riwayat: [
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    {
        id: 5, kode: "SIL-000006-001", produk: "Cincin Clover", kategori: "Silver", sub_kategori: "",
        berat: "2g", karat: "18K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Repair",
        no_seri: "", keterangan: "",
        image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop",
        product_id: 5, branch_id: 1,
        riwayat: [
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    {
        id: 6, kode: "CKM-000006-002", produk: "Gelang Bali Ukir", kategori: "Cukim", sub_kategori: "",
        berat: "4g", karat: "10K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Lost",
        no_seri: "", keterangan: "",
        image: "https://images.unsplash.com/photo-1573408301185-9519f94815b4?w=200&h=200&fit=crop",
        product_id: 6, branch_id: 1,
        riwayat: [
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    {
        id: 7, kode: "BRL-000006-001", produk: "Gelang Bali Ukir", kategori: "Perhiasan", sub_kategori: "Berlian",
        berat: "4g", karat: "10K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Available",
        no_seri: "", keterangan: "",
        image: "https://images.unsplash.com/photo-1573408301185-9519f94815b4?w=200&h=200&fit=crop",
        product_id: 7, branch_id: 1,
        riwayat: [
            { title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" },
        ],
    },
    { id: 8, kode: "ANT-000006-003", produk: "Anting Daun", kategori: "Perhiasan", sub_kategori: "Anting", berat: "3g", karat: "18K", modal: 3200000, jual: 3900000, cabang: "BLOK M 1", status: "Available", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop", product_id: 8, branch_id: 1, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 9, kode: "KAL-000006-003", produk: "Kalung Salib", kategori: "Perhiasan", sub_kategori: "Kalung", berat: "6g", karat: "22K", modal: 6100000, jual: 7200000, cabang: "BLOK M 1", status: "Transit", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop", product_id: 9, branch_id: 1, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 10, kode: "CIN-000007-001", produk: "Cincin Polos", kategori: "Perhiasan", sub_kategori: "Cincin", berat: "3g", karat: "24K", modal: 4800000, jual: 5600000, cabang: "BLOK M 1", status: "Available", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop", product_id: 10, branch_id: 1, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 11, kode: "GEL-000007-001", produk: "Gelang Polos", kategori: "Perhiasan", sub_kategori: "Gelang", berat: "5g", karat: "22K", modal: 4200000, jual: 5000000, cabang: "BLOK M 2", status: "Available", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1573408301185-9519f94815b4?w=200&h=200&fit=crop", product_id: 11, branch_id: 2, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 12, kode: "KAL-000007-002", produk: "Kalung Hati", kategori: "Perhiasan", sub_kategori: "Kalung", berat: "7g", karat: "18K", modal: 7100000, jual: 8300000, cabang: "BLOK M 2", status: "Sold", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop", product_id: 12, branch_id: 2, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 13, kode: "ANT-000007-001", produk: "Anting Bulat", kategori: "Perhiasan", sub_kategori: "Anting", berat: "2g", karat: "18K", modal: 2900000, jual: 3500000, cabang: "BLOK M 2", status: "Repair", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop", product_id: 13, branch_id: 2, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 14, kode: "LGM-000007-001", produk: "ANTAM 5g", kategori: "Logam Mulia", sub_kategori: "", berat: "5g", karat: "24K", modal: 4900000, jual: 5800000, cabang: "BLOK M 2", status: "Available", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200&h=200&fit=crop", product_id: 14, branch_id: 2, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
    { id: 15, kode: "CIN-000008-001", produk: "Cincin Berlian", kategori: "Perhiasan", sub_kategori: "Cincin", berat: "4g", karat: "18K", modal: 9500000, jual: 11000000, cabang: "BLOK M 2", status: "Available", no_seri: "", keterangan: "", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop", product_id: 15, branch_id: 2, riwayat: [{ title: "Input awal item", actor: "Yanuar", date: "21 Mei 2026, 12:00" }] },
];

const PRODUCT_OPTIONS = DUMMY_ITEMS
    .reduce((acc, item) => acc.find((p) => p.value === item.product_id) ? acc : [...acc, { value: item.product_id, label: item.produk }], []);

const BRANCH_OPTIONS = [
    { value: 1, label: "BLOK M 1" },
    { value: 2, label: "BLOK M 2" },
];

const STATUS_CONFIG = {
    Available: { bg: "bg-success-100", text: "text-success-700" },
    Transit:   { bg: "bg-warning-100", text: "text-warning-700" },
    Sold:      { bg: "bg-gray-100",    text: "text-gray-600" },
    Repair:    { bg: "bg-info-100",    text: "text-info-700" },
    Lost:      { bg: "bg-danger-100",  text: "text-danger-700" },
};

const STATUS_OPTIONS   = ["Available", "Transit", "Sold", "Repair", "Lost"].map(v => ({ value: v, label: v }));
const KATEGORI_OPTIONS = ["Perhiasan", "Logam Mulia", "Silver", "Cukim"].map(v => ({ value: v, label: v }));

const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");

// ─── Main Page ────────────────────────────────────────────────────────────────
const MasterInventory = () => {
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [search, setSearch]         = useState({ kode: "" });
    const [filter, setFilter]         = useState({ status: "", kategori: "" });

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal]     = useState(false);
    const [selectedItem, setSelectedItem]       = useState(null);
    const [formData, setFormData]               = useState(null);
    const [formErrors, setFormErrors]           = useState({});

    const fetchData = (page = 1, pageSize = 10, kode = "", status = "", kategori = "") => {
        const filtered = DUMMY_ITEMS.filter(item => {
            const matchKode = !kode ||
                item.kode.toLowerCase().includes(kode.toLowerCase()) ||
                item.produk.toLowerCase().includes(kode.toLowerCase()) ||
                item.berat.toLowerCase().includes(kode.toLowerCase()) ||
                item.karat.toLowerCase().includes(kode.toLowerCase());
            const matchStatus   = !status   || item.status   === status;
            const matchKategori = !kategori || item.kategori === kategori;
            return matchKode && matchStatus && matchKategori;
        });

        const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
        setParamFetch({ data: paginated, page, total: filtered.length, pageSize });
    };

    useEffect(() => { fetchData(); }, []);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
        fetchData(1, paramFetch.pageSize, value, filter.status, filter.kategori);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilter = { ...filter, [name]: value };
        setFilter(newFilter);
        fetchData(1, paramFetch.pageSize, search.kode, newFilter.status, newFilter.kategori);
    };

    const onChangePage     = (page)     => fetchData(page, paramFetch.pageSize, search.kode, filter.status, filter.kategori);
    const onChangePageSize = (pageSize) => fetchData(1,    pageSize,            search.kode, filter.status, filter.kategori);

    const handleViewDetail = (row) => {
        setSelectedItem(row);
        setShowDetailModal(true);
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
    };

    const handleEdit = (row) => {
        setFormData({ ...row, foto: row.image });
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
            const found = PRODUCT_OPTIONS.find((p) => p.value === value);
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

        // TODO: kirim ke API saat backend sudah ready
        handleCloseEdit();
    };

    const columns = [
        {
            header: "Kode",
            accessor: "kode",
            render: (row) => (
                <span className="text-gray-700 text-sm">{row.kode}</span>
            ),
        },
        {
            header: "Produk",
            accessor: "produk",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <img
                        src={row.image}
                        alt={row.produk}
                        className="w-8 h-8 rounded object-cover flex-shrink-0 bg-gray-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-gray-900">{row.produk}</span>
                </div>
            ),
        },
        { header: "Kategori", accessor: "kategori" },
        { header: "Sub Kategori", accessor: "sub_kategori", render: (row) => row.sub_kategori || "-" },
        { header: "Berat",    accessor: "berat" },
        { header: "Karat",    accessor: "karat" },
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
        { header: "Cabang", accessor: "cabang" },
        {
            header: "Status",
            accessor: "status",
            render: (row) => {
                const cfg = STATUS_CONFIG[row.status] || { bg: "bg-gray-100", text: "text-gray-600" };
                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        {row.status}
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
                    {row.status === "Available" && (
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
                            options: KATEGORI_OPTIONS,
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
                page={paramFetch.page}
                pageSize={paramFetch.pageSize}
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
                productOptions={PRODUCT_OPTIONS}
                branchOptions={BRANCH_OPTIONS}
            />
        </div>
    );
};

export default MasterInventory;
