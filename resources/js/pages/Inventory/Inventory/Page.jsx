import { useState, useEffect } from "react";
import { PackageIcon, EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const DUMMY_ITEMS = [
    { id: 1,  kode: "CIN-000006-002", produk: "Cincin Flower",       kategori: "Cincin",      berat: "5.20g", karat: "22K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Available", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=48&h=48&fit=crop" },
    { id: 2,  kode: "KAL-000006-001", produk: "Kalung Italy Rantai", kategori: "Kalung",      berat: "8.50g", karat: "18K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Available", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=48&h=48&fit=crop" },
    { id: 3,  kode: "LGM-000006-001", produk: "ANTAM",               kategori: "Logam Mulia", berat: "10g",   karat: "24K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Transit",   image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=48&h=48&fit=crop" },
    { id: 4,  kode: "CKM-000006-001", produk: "Anting Mutiara",      kategori: "Anting",      berat: "5g",    karat: "22K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Sold",      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=48&h=48&fit=crop" },
    { id: 5,  kode: "CIN-000006-001", produk: "Cincin Clover",       kategori: "Cincin",      berat: "2g",    karat: "18K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Repair",    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=48&h=48&fit=crop" },
    { id: 6,  kode: "GEL-000006-002", produk: "Gelang Bali Ukir",    kategori: "Gelang",      berat: "4g",    karat: "10K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Lost",      image: "https://images.unsplash.com/photo-1573408301185-9519f94815b4?w=48&h=48&fit=crop" },
    { id: 7,  kode: "GEL-000006-001", produk: "Gelang Bali Ukir",    kategori: "Gelang",      berat: "4g",    karat: "10K", modal: 5460000, jual: 6440000, cabang: "BLOK M 1", status: "Available", image: "https://images.unsplash.com/photo-1573408301185-9519f94815b4?w=48&h=48&fit=crop" },
    { id: 8,  kode: "ANT-000006-003", produk: "Anting Daun",         kategori: "Anting",      berat: "3g",    karat: "18K", modal: 3200000, jual: 3900000, cabang: "BLOK M 1", status: "Available", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=48&h=48&fit=crop" },
    { id: 9,  kode: "KAL-000006-003", produk: "Kalung Salib",        kategori: "Kalung",      berat: "6g",    karat: "22K", modal: 6100000, jual: 7200000, cabang: "BLOK M 1", status: "Transit",   image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=48&h=48&fit=crop" },
    { id: 10, kode: "CIN-000007-001", produk: "Cincin Polos",        kategori: "Cincin",      berat: "3g",    karat: "24K", modal: 4800000, jual: 5600000, cabang: "BLOK M 1", status: "Available", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=48&h=48&fit=crop" },
    { id: 11, kode: "GEL-000007-001", produk: "Gelang Polos",        kategori: "Gelang",      berat: "5g",    karat: "22K", modal: 4200000, jual: 5000000, cabang: "BLOK M 2", status: "Available", image: "https://images.unsplash.com/photo-1573408301185-9519f94815b4?w=48&h=48&fit=crop" },
    { id: 12, kode: "KAL-000007-002", produk: "Kalung Hati",         kategori: "Kalung",      berat: "7g",    karat: "18K", modal: 7100000, jual: 8300000, cabang: "BLOK M 2", status: "Sold",      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=48&h=48&fit=crop" },
    { id: 13, kode: "ANT-000007-001", produk: "Anting Bulat",        kategori: "Anting",      berat: "2g",    karat: "18K", modal: 2900000, jual: 3500000, cabang: "BLOK M 2", status: "Repair",    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=48&h=48&fit=crop" },
    { id: 14, kode: "LGM-000007-001", produk: "ANTAM 5g",            kategori: "Logam Mulia", berat: "5g",    karat: "24K", modal: 4900000, jual: 5800000, cabang: "BLOK M 2", status: "Available", image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=48&h=48&fit=crop" },
    { id: 15, kode: "CIN-000008-001", produk: "Cincin Berlian",      kategori: "Cincin",      berat: "4g",    karat: "18K", modal: 9500000, jual: 11000000, cabang: "BLOK M 2", status: "Available", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=48&h=48&fit=crop" },
];

const STATUS_CONFIG = {
    Available: { bg: "bg-success-100", text: "text-success-700" },
    Transit:   { bg: "bg-warning-100", text: "text-warning-700" },
    Sold:      { bg: "bg-gray-100",    text: "text-gray-600" },
    Repair:    { bg: "bg-info-100",    text: "text-info-700" },
    Lost:      { bg: "bg-danger-100",  text: "text-danger-700" },
};

const STATUS_OPTIONS   = ["Available", "Transit", "Sold", "Repair", "Lost"].map(v => ({ value: v, label: v }));
const KATEGORI_OPTIONS = ["Cincin", "Kalung", "Anting", "Gelang", "Logam Mulia"].map(v => ({ value: v, label: v }));

const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");

// ─── Main Page ────────────────────────────────────────────────────────────────
const MasterInventory = () => {
    const [paramFetch, setParamFetch] = useState({ data: [], page: 1, total: 0, pageSize: 10 });
    const [search, setSearch]         = useState({ kode: "" });
    const [filter, setFilter]         = useState({ status: "", kategori: "" });

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
                        className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={18} />
                    </button>
                    {row.status === "Available" && (
                        <button
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
        </div>
    );
};

export default MasterInventory;
