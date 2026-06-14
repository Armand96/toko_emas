import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import { PlusCircleIcon, EyeIcon, XIcon, PrinterIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import InputGroup from "../../components/FormElement/InputGroup";
import Table from "../../components/Table/Table";
import LoadingStore from "../../Store/LoadingStore";
import ModalViewPenjualan from "./ModalView";
import HelperFunctions from "../../utils/HelperFunctions";
import PenjualanApis from "../../Services/Penjualan.apis";
import { showAlert } from "../../utils/showAlert";

const STATUS_OPTIONS = [
    { value: 'APPROVAL', label: 'Approval' },
    { value: 'CETAK KWITANSI', label: 'Cetak Kwitansi' },
    { value: 'SELESAI', label: 'Selesai' },
    { value: 'DITOLAK', label: 'Ditolak' },
];

const STATUS_STYLE = {
    'SELESAI': 'bg-success-50 text-success-700 border-success-200',
    'CETAK KWITANSI': 'bg-info-50 text-info-700 border-info-200',
    'APPROVAL': 'bg-warning-50 text-warning-700 border-warning-200',
    'DITOLAK': 'bg-danger-50 text-danger-700 border-danger-200',
};

const STATUS_LABEL = {
    'SELESAI': 'Selesai',
    'CETAK KWITANSI': 'Cetak Kwitansi',
    'APPROVAL': 'Approval',
    'DITOLAK': 'Ditolak',
};

const Main = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [search, setSearch] = useState({
        search: '',
        status: '',
    });
    const [searchBounce] = useDebounce(search, 500);
    const [firstLoading, setFirstLoading] = useState(false);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const fetchData = async (page = 1, pageSize = 10, filters = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                per_page: pageSize,
            });
            if (filters.search) params.append('order_id', filters.search);
            if (filters.status) params.append('status', filters.status);

            const res = await PenjualanApis.GetPenjualan(`?${params.toString()}`);
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
            fetchData(1, paramFetch.per_page, searchBounce);
        }
    }, [searchBounce]);

    const handleViewTransaction = async (row) => {
        setLoading(true);
        try {
            const res = await PenjualanApis.GetPenjualanDetail(row.id);
            setSelectedData(res?.data || null);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error(error);
            showAlert({
                icon: 'error',
                title: 'Gagal',
                message: 'Gagal memuat detail transaksi',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (row) => {
        showAlert({
            icon: 'warning',
            isAutoClose: false,
            title: 'Tolak Transaksi Penjualan',
            message: `Apakah Anda yakin ingin menolak transaksi ${row.order_id}?`,
            confirmText: 'Ya, Tolak',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) {
                PenjualanApis.PutPenjualanApproval({
                    sales_ids: [row.id],
                    status: 'DITOLAK',
                }).then(() => {
                    fetchData(paramFetch.current_page, paramFetch.per_page, searchBounce);
                    showAlert({
                        icon: 'success',
                        isAutoClose: false,
                        title: 'Berhasil',
                        message: 'Transaksi telah ditolak',
                    });
                }).catch((error) => {
                    console.error(error);
                    showAlert({
                        icon: 'error',
                        title: 'Gagal',
                        message: 'Gagal menolak transaksi',
                    });
                });
            }
        });
    };

    const handlePrint = (row) => {
        window.open(`/penjualan/print/${row.id}`, '_blank');
    };

    const searchFields = [
        { name: 'search', label: '', type: 'text', placeholder: 'Cari transaksi..' },
        { name: 'status', label: '', type: 'dropdown', placeholder: 'Pilih status', options: STATUS_OPTIONS },
    ];

    const columns = [
        {
            header: 'Tanggal',
            accessor: 'created_at',
            render: (row) => row.created_at ? dayjs(row.created_at).format('DD/MM/YYYY') : '-',
        },
        { header: 'Order ID', accessor: 'order_id' },
        { header: 'Customer', accessor: 'customer', render: (row) => row.customer?.customer_name ?? '-' },
        {
            header: 'Item Produk',
            accessor: 'details',
            render: (row) => {
                const items = row.details || [];
                if (items.length === 0) return '-';
                const names = items.map((d) => d.product?.product_name).filter(Boolean);
                return names.join(', ');
            },
        },
        {
            header: 'Status',
            accessor: 'approval_status',
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${STATUS_STYLE[row.approval_status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {STATUS_LABEL[row.approval_status] || row.approval_status}
                </span>
            ),
        },
        { header: 'Nominal', accessor: 'grand_total', render: (row) => HelperFunctions.formatCurrency(row.grand_total || 0) },
        { header: 'Pembayaran', accessor: 'payment_type', render: (row) => row.payment_type === 'TUNAI' ? 'Tunai' : 'Transfer' },
        { header: 'User', accessor: 'user', render: (row) => row.user?.name ?? '-' },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.approval_status === 'APPROVAL' && (
                        <button
                            onClick={() => handleCancel(row)}
                            className="p-1.5 btn-outline !text-danger-500 !border-danger-500 hover:bg-danger-50 rounded-md transition-colors"
                            title="Tolak"
                        >
                            <XIcon size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => handleViewTransaction(row)}
                        className="p-1.5 btn-outline text-info-500 hover:bg-info-50 rounded-md transition-colors"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={20} />
                    </button>
                    {row.approval_status === 'CETAK KWITANSI' && (
                        <button
                            onClick={() => handlePrint(row)}
                            className="p-1.5 btn-outline text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
                            title="Cetak Kwitansi"
                        >
                            <PrinterIcon size={20} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const onChangePage = (page) =>
        fetchData(page, paramFetch.per_page, searchBounce);

    const onChangePageSize = (pageSize) =>
        fetchData(1, pageSize, searchBounce);

    return (
        <div className="flex flex-col gap-6 w-full relative">
            <HeaderSection
                title="Penjualan"
                description="Catat dan kelola transaksi penjualan barang kepada pelanggan."
                icon={PlusCircleIcon}
                onClick={() => setCurentState('form')}
                textButton="Transaksi Baru"
            />

            <div className="w-full xl:w-2/5">
                <InputGroup
                    fields={searchFields}
                    formData={search}
                    cols='2'
                    onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
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

            <ModalViewPenjualan
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedData(null);
                }}
                data={selectedData}
            />
        </div>
    );
}

export default Main;
