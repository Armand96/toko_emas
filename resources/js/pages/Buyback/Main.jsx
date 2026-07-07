import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import { PlusCircleIcon } from "@phosphor-icons/react";
import { useQueryParams } from "../../utils/useQueryParams";
import HeaderSection from "../../components/HeaderSection";
import ActionButton, { ActionButtonGroup } from "../../components/ActionButton";
import Badge from "../../components/Badge";
import FilterBar from "../../components/FilterBar";
import Table from "../../components/Table/Table";
import LoadingStore from "../../Store/LoadingStore";
import ModalViewBuyback from "./ModalView";
import HelperFunctions from "../../utils/HelperFunctions";
import BuybackApis from "../../Services/Buyback.apis";
import PermissionStore from "../../Store/PermissionStore";
import AuthStore from "../../Store/AuthStore";
import OptionsStore from "../../Store/OptionsStore";
import { showAlert } from "../../utils/showAlert";

// Status buyback (BE enum): APPROVAL | CETAK KWITANSI | SELESAI | DITOLAK | DIBATALKAN
const STATUS_LABEL = {
    'APPROVAL': 'Approval',
    'CETAK KWITANSI': 'Cetak Kwitansi',
    'SELESAI': 'Selesai',
    'DITOLAK': 'Ditolak',
    'DIBATALKAN': 'Dibatalkan',
};

const STATUS_TONE = {
    'APPROVAL': 'warning',
    'CETAK KWITANSI': 'info',
    'SELESAI': 'success',
    'DITOLAK': 'danger',
    'DIBATALKAN': 'danger',
};

const STATUS_OPTIONS = [
    { value: 'APPROVAL', label: 'Approval' },
    { value: 'CETAK KWITANSI', label: 'Cetak Kwitansi' },
    { value: 'SELESAI', label: 'Selesai' },
    { value: 'DITOLAK', label: 'Ditolak' },
    { value: 'DIBATALKAN', label: 'Dibatalkan' },
];

const Main = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const [branchOptions, setBranchOptions] = useState([]);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [{ search: urlSearch, status: urlStatus, branch_id: urlBranchId, page: urlPage, per_page: urlPerPage }, setQuery] = useQueryParams({
        search: '',
        status: '',
        branch_id: '',
        page: 1,
        per_page: 10,
    });
    const [search, setSearch] = useState({
        search: urlSearch,
        status: urlStatus,
        branch_id: urlBranchId,
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
            if (filters.search) params.append('buyback_id', filters.search);
            if (filters.status) params.append('status', filters.status);
            if (isKasir() && user?.branch_id) params.append('branch_id', user.branch_id);
            else if (filters.branch_id) params.append('branch_id', filters.branch_id);

            const res = await BuybackApis.GetBuyback(`?${params.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(urlPage, urlPerPage, { search: urlSearch, status: urlStatus, branch_id: urlBranchId });
        if (!isKasir()) {
            ensureBranches()
                .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")))
                .catch((err) => console.error(err));
        }
    }, []);

    useEffect(() => {
        if (firstLoading) {
            setQuery({ search: searchBounce.search, status: searchBounce.status, branch_id: searchBounce.branch_id, page: 1 });
            fetchData(1, paramFetch.per_page, searchBounce);
        }
    }, [searchBounce]);

    const handleViewTransaction = async (row) => {
        setLoading(true);
        try {
            const res = await BuybackApis.GetBuybackDetail(row.id);
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
            title: 'Batalkan Transaksi Buyback',
            message: `Apakah Anda yakin ingin membatalkan transaksi ${row.buyback_id}? Transaksi yang dibatalkan tidak dapat diproses kembali.`,
            confirmText: 'Ya, Batalkan',
            cancelText: 'Kembali',
        }).then((res) => {
            if (res.confirmed) {
                BuybackApis.PutBuybackApproval({
                    buyback_id: row.id,
                    status: 'DIBATALKAN',
                }).then(() => {
                    fetchData(paramFetch.current_page, paramFetch.per_page, searchBounce);
                    showAlert({
                        icon: 'success',
                        isAutoClose: true,
                        title: 'Berhasil Dibatalkan',
                        message: 'Transaksi buyback telah dibatalkan.',
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
            const res = await BuybackApis.GetBuybackDetail(row.id);
            const detail = res?.data || row;
            detail.details = await HelperFunctions.enrichSalesDetails(detail.details);

            sessionStorage.setItem('print_buyback_kwitansi_data', JSON.stringify(detail));
            window.open('/buyback/print-kwitansi', '_blank');

            if (row.status !== 'SELESAI') {
                await BuybackApis.PutBuybackApproval({
                    buyback_id: row.id,
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

    const columns = [
        {
            header: 'Tanggal',
            accessor: 'created_at',
            render: (row) => row.created_at ? dayjs(row.created_at).format('DD/MM/YYYY') : '-',
        },
        { header: 'Buyback ID', accessor: 'buyback_id' },
        { header: 'Customer', accessor: 'customer', render: (row) => row.customer?.customer_name ?? '-' },
        {
            header: 'Item Produk',
            accessor: 'details',
            render: (row) => HelperFunctions.summarizeItems(
                row.details,
                (d) => d.product?.product_name
            ),
        },
        { header: 'Nominal', accessor: 'grand_total', render: (row) => HelperFunctions.formatCurrency(row.grand_total || 0) },
        { header: 'Pembayaran', accessor: 'payment_type', render: (row) => row.payment_type === 'TUNAI' ? 'Tunai' : 'Transfer' },
        { header: 'User', accessor: 'user', render: (row) => row.user?.name ?? '-' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || 'gray'}>
                    {STATUS_LABEL[row.status] || row.status}
                </Badge>
            ),
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    {['APPROVAL', 'CETAK KWITANSI'].includes(row.status) && isKasir() && can('delete') && (
                        <ActionButton variant="cancel" title="Batalkan" onClick={() => handleCancel(row)} />
                    )}
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewTransaction(row)} />
                    {(['SELESAI', 'CETAK KWITANSI'].includes(row.status) && isKasir()) && (
                        <ActionButton variant="print" title="Cetak Kwitansi" onClick={() => handlePrint(row)} />
                    )}
                </ActionButtonGroup>
            ),
        },
    ];

    const onChangePage = (page) => {
        setQuery({ page, per_page: paramFetch.per_page });
        fetchData(page, paramFetch.per_page, searchBounce);
    };

    const onChangePageSize = (pageSize) => {
        setQuery({ page: 1, per_page: pageSize });
        fetchData(1, pageSize, searchBounce);
    };

    return (
        <div className="flex flex-col gap-6 w-full relative">
            <HeaderSection
                title="Buyback"
                description="Kelola transaksi pembelian kembali emas dari customer."
                icon={PlusCircleIcon}
                onClick={can('create') ? () => setCurentState('form') : undefined}
                textButton="Transaksi Baru"
            />

            <FilterBar
                value={search}
                onChange={setSearch}
                fields={[
                    { name: 'search', type: 'search', placeholder: 'Cari kode...' },
                    { name: 'status', type: 'dropdown', placeholder: 'Pilih status', options: STATUS_OPTIONS },
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

            <ModalViewBuyback
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
