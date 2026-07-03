import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import { PlusCircleIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import ActionButton, { ActionButtonGroup } from "../../components/ActionButton";
import Badge from "../../components/Badge";
import InputGroup from "../../components/FormElement/InputGroup";
import FilterBar from "../../components/FilterBar";
import Table from "../../components/Table/Table";
import LoadingStore from "../../Store/LoadingStore";
import ModalViewPenjualan from "./ModalView";
import HelperFunctions from "../../utils/HelperFunctions";
import PenjualanApis from "../../Services/Penjualan.apis";
import PermissionStore from "../../Store/PermissionStore";
import AuthStore from "../../Store/AuthStore";
import { showAlert } from "../../utils/showAlert";

const STATUS_OPTIONS = [
    { value: 'APPROVAL', label: 'Approval' },
    { value: 'DISETUJUI', label: 'Disetujui' },
    { value: 'CETAK KWITANSI', label: 'Cetak Kwitansi' },
    { value: 'SELESAI', label: 'Selesai' },
    { value: 'DITOLAK', label: 'Ditolak' },
    { value: 'DIBATALKAN', label: 'Dibatalkan' },
];

const STATUS_TONE = {
    'SELESAI': 'success',
    'DISETUJUI': 'success',
    'CETAK KWITANSI': 'info',
    'APPROVAL': 'warning',
    'DITOLAK': 'danger',
    'DIBATALKAN': 'danger',
};

const STATUS_LABEL = {
    'SELESAI': 'Selesai',
    'DISETUJUI': 'Disetujui',
    'CETAK KWITANSI': 'Cetak Kwitansi',
    'APPROVAL': 'Approval',
    'DITOLAK': 'Ditolak',
    'DIBATALKAN': 'Dibatalkan',
};

const Main = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);

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
            if (filters.status) {
                params.append('approval_status', filters.status);
                params.append('status', filters.status);
            }
            if (isKasir() && user?.branch_id) params.append('branch_id', user.branch_id);

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
            const detail = res?.data || null;
            if (detail) {
                detail.details = await HelperFunctions.enrichSalesDetails(detail.details);
            }
            setSelectedData(detail);
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
            title: 'Batalkan Transaksi Penjualan',
            message: `Apakah Anda yakin ingin membatalkan transaksi ${row.order_id}? Transaksi yang dibatalkan tidak dapat diproses kembali.`,
            confirmText: 'Ya, Batalkan',
            cancelText: 'Kembali',
        }).then((res) => {
            if (res.confirmed) {
                PenjualanApis.PutPenjualanApproval({
                    penjualan_id: row.id,
                    status: 'DIBATALKAN',
                }).then(() => {
                    fetchData(paramFetch.current_page, paramFetch.per_page, searchBounce);
                    showAlert({
                        icon: 'success',
                        isAutoClose: true,
                        title: 'Berhasil Dibatalkan',
                        message: 'Transaksi penjualan telah dibatalkan.',
                    });
                }).catch((error) => {
                    console.error(error);
                    showAlert({
                        icon: 'error',
                        title: 'Gagal',
                        message: 'Gagal membatalkan transaksi',
                    });
                });
            }
        });
    };

    const handlePrint = async (row) => {
        setLoading(true);
        try {
            const res = await PenjualanApis.GetPenjualanDetail(row.id);
            const detail = res?.data || row;
            detail.details = await HelperFunctions.enrichSalesDetails(detail.details);

            sessionStorage.setItem('print_kwitansi_data', JSON.stringify(detail));
            window.open('/penjualan/print-kwitansi', '_blank');

            if (row.approval_status !== 'SELESAI') {
                await PenjualanApis.PutPenjualanApproval({
                    penjualan_id: row.id,
                    status: 'SELESAI',
                });

                fetchData(paramFetch.current_page, paramFetch.per_page, searchBounce);
                showAlert({
                    icon: 'success',
                    isAutoClose: true,
                    title: 'Berhasil',
                    message: 'Kwitansi telah dicetak dan transaksi dinyatakan selesai',
                });
            }
        } catch (error) {
            console.error(error);
            showAlert({
                icon: 'error',
                title: 'Gagal',
                message: 'Gagal mencetak kwitansi',
            });
        } finally {
            setLoading(false);
        }
    };

    const searchFieldsPenjualan = [
        { name: 'search', label: '', type: 'search', placeholder: 'Cari kode...' },
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
                if (names.length <= 3) return names.join(', ');
                return `${names.slice(0, 3).join(', ')} +${names.length - 3} lainnya`;
            },
        },
        {
            header: 'Status',
            accessor: 'approval_status',
            render: (row) => (
                <Badge tone={STATUS_TONE[row.approval_status] || 'gray'}>
                    {STATUS_LABEL[row.approval_status] || row.approval_status}
                </Badge>
            ),
        },
        { header: 'Nominal', accessor: 'grand_total', render: (row) => HelperFunctions.formatCurrency(row.grand_total || 0) },
        { header: 'Pembayaran', accessor: 'payment_type', render: (row) => row.payment_type === 'TUNAI' ? 'Tunai' : 'Transfer' },
        { header: 'User', accessor: 'user', render: (row) => row.user?.name ?? '-' },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    {['APPROVAL', 'DISETUJUI'].includes(row.approval_status) && isKasir() && can('delete') && (
                        <ActionButton variant="cancel" title="Batalkan" onClick={() => handleCancel(row)} />
                    )}
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewTransaction(row)} />
                    {(row.approval_status === 'SELESAI' || row.approval_status === 'DISETUJUI' || row.approval_status === 'CETAK KWITANSI') && (
                        <ActionButton variant="print" title="Cetak Kwitansi" onClick={() => handlePrint(row)} />
                    )}
                </ActionButtonGroup>
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
                onClick={can('create') ? () => setCurentState('form') : undefined}
                textButton="Transaksi Baru"
            />

            <FilterBar>
                <FilterBar.Search>
                    <InputGroup
                        fields={searchFieldsPenjualan}
                        formData={search}
                        cols='1'
                        onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
                    />
                </FilterBar.Search>
                <FilterBar.Item>
                    <InputGroup
                        fields={[{ name: 'status', label: '', type: 'dropdown', placeholder: 'Pilih status', options: STATUS_OPTIONS }]}
                        formData={search}
                        cols='1'
                        onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
                    />
                </FilterBar.Item>
            </FilterBar>

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
