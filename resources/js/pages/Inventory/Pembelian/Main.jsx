import { useEffect, useState } from "react";
import { PlusCircleIcon, EyeIcon, XIcon, PrinterIcon } from "@phosphor-icons/react";
import { useDebounce } from "use-debounce";

import HeaderSection from "../../../components/HeaderSection";
import InputGroup from "../../../components/FormElement/InputGroup";
import Table from "../../../components/Table/Table";
import FooterActionBar from "../../../components/FooterActionBar";
import ModalView from "./modalView";

import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import InventoryApis from "../../../Services/Inventory.apis";
import { showAlert } from "../../../utils/showAlert";
import dayjs from "dayjs";

const MainPembelian = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });
    const [search, setSearch] = useState({ search: "" });
    const [searchBounce] = useDebounce(search, 500);
    const [firstLoading, setFirstLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const fetchData = async (page = 1, pageSize = 10, keyword = "") => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetPembelian(
                `?page=${page}&limit=${pageSize}${keyword ? `&search=${keyword}` : ""}`
            );
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, search.search);
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
                    fetchData(paramFetch.current_page, paramFetch.per_page, search.search);
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
        const barcodes = approvedItems.map(item => item.inventory_code);
        const items = approvedItems.map(item => ({
            barcode: item.barcode,
            label: item.product?.product_name ?? item.product?.name ?? '',
        }));
        HelperFunctions.printBarcode(barcodes, { items });
    };

    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={
                        selectedRows.length > 0 &&
                        selectedRows.length === paramFetch.data.filter(item => selectableStatuses.includes(item.status)).length
                    }
                />
            ),
            accessor: 'checkbox',
            render: (row) => selectableStatuses.includes(row.status) ? (
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
        { header: "Kode", accessor: "barcode", },
        { header: "Produk", accessor: "produk", render: (row) => row.product?.name ?? row.product?.product_name ?? "-" },
        { header: "Kategori", accessor: "category", render: (row) => row.category?.category_name || "-" },
        { header: "Sub Kategori", accessor: "category", render: (row) => row.category?.parent_id ? row.category_name : "-" },

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
            render: (row) => HelperFunctions.formatCurrency(row.jual || 0),
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
                    "DISETUJUI": { label: 'Disetujui', style: 'bg-success-50 text-success-700 border-success-200' },
                    "DITOLAK": { label: 'Ditolak', style: 'bg-danger-50 text-danger-700 border-danger-200' },
                    "DIBATALKAN": { label: 'Dibatalkan', style: 'bg-danger-50 text-danger-700 border-danger-200' },
                    "APPROVAL": { label: 'Approval', style: 'bg-warning-50 text-warning-700 border-warning-200' }
                };

                const status = statusMap[row.status] || { label: 'Unknown', style: 'bg-gray-50 text-gray-700 border-gray-200' };

                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${status.style}`}>
                        {status.label}
                    </span>
                );
            }
        },
        {
            header: "Aksi",
            accessor: "aksi",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedData(row);
                            setIsModalOpen(true);
                        }}
                        className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"
                    >
                        <EyeIcon size={20} />
                    </button>
                    {
                        ["APPROVAL"].includes(row?.status) && <button
                            onClick={() => handleCancel(row)}
                            className="p-1.5 btn-outline !text-danger-500 !border-danger-500 hover:bg-info-50 rounded-md cursor-pointer"
                        >
                            <XIcon size={20} />
                        </button>
                    }
                    {
                        row?.status === "DISETUJUI" && <button
                            onClick={() => HelperFunctions.printBarcode(row.barcode, { label: row.product?.product_name ?? row.product?.name })}
                            className="p-1.5 btn-outline hover:bg-info-50 rounded-md cursor-pointer"
                            title="Cetak QR Code"
                        >
                            <PrinterIcon size={20} />
                        </button>
                    }
                </div>
            ),
        },
    ];

    const onChangePage = (page) =>
        fetchData(page, paramFetch.per_page, search.search);

    const onChangePageSize = (pageSize) =>
        fetchData(1, pageSize, search.search);

    return (
        <div className={`flex flex-col gap-6 w-full relative min-h-full ${selectedRows.length > 0 ? 'pb-24 lg:pb-28' : ''}`}>
            <HeaderSection
                title="Pembelian"
                description="Kelola data pembelian dan item inventory."
                icon={PlusCircleIcon}
                onClick={() => setCurentState && setCurentState("form")}
                textButton="Tambah Pembelian"
            />

            <div className="w-full lg:w-1/3">
                <InputGroup
                    fields={[
                        {
                            name: "search",
                            label: "",
                            type: "text",
                            placeholder: "Cari pembelian...",
                        },
                    ]}
                    formData={search}
                    cols="1"
                    onChange={(e) =>
                        setSearch({ ...search, [e.target.name]: e.target.value })
                    }
                />
            </div>

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
                data={selectedData}
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
