import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CheckSquareOffsetIcon } from "@phosphor-icons/react";
import ActionButton from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import dayjs from "dayjs";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import FilterBar from "../../../components/FilterBar";
import ModalDetailBuyback from "./Modal";
import { showAlert } from '../../../utils/showAlert';
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import BuybackApis from "../../../Services/Buyback.apis";
import PermissionStore from "../../../Store/PermissionStore";
import OptionsStore from "../../../Store/OptionsStore";
import { useQueryParams } from "../../../utils/useQueryParams";

const STATUS_TONE = {
    'APPROVAL': 'warning',
    'DISETUJUI': 'success',
    'CETAK KWITANSI': 'info',
    'SELESAI': 'success',
    'DITOLAK': 'danger',
    'DIBATALKAN': 'danger',
};

const STATUS_LABEL = {
    'APPROVAL': 'Approval',
    'DISETUJUI': 'Disetujui',
    'DITOLAK': 'Ditolak',
    'DIBATALKAN': 'Dibatalkan',
};

const ApprovalBuyback = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [branchOptions, setBranchOptions] = useState([]);
    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [
        { search: urlSearch, cabang: urlCabang, status: urlStatus, page: urlPage, per_page: urlPerPage },
        setQuery,
    ] = useQueryParams({ search: '', cabang: '', status: 'APPROVAL', page: 1, per_page: 10 });

    const [filter, setFilter] = useState({ search: urlSearch, cabang: urlCabang, status: urlStatus });
    const [filterBounce] = useDebounce(filter, 500);
    const [firstLoading, setFirstLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                per_page: pageSize,
            });
            if (params.status) {
                query.append('approval_status', params.status);
                query.append('status', params.status);
            }
            if (params.search) query.append('order_id', params.search);
            if (params.cabang) query.append('branch_id', params.cabang);

            const res = await BuybackApis.GetBuyback(`?${query.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(urlPage, urlPerPage, filter);
        ensureBranches()
            .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")));
    }, []);

    useEffect(() => {
        if (firstLoading) {
            setQuery({ search: filterBounce.search, cabang: filterBounce.cabang, status: filterBounce.status, page: 1 });
            fetchData(1, paramFetch.per_page, filterBounce);
        }
    }, [filterBounce]);

    const filteredData = paramFetch.data || [];

    const handleOpenModal = async (row) => {
        setLoading(true);
        try {
            const res = await BuybackApis.GetBuybackDetail(row.id);
            const detail = res?.data || null;
            if (detail) {
                detail.details = await HelperFunctions.enrichSalesDetails(detail.details);
            }
            setSelectedData(detail);
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal memuat detail transaksi' });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedData(null);
    };

    const updateStatus = async (id, status, note = null) => {
        setLoading(true);
        try {
            await BuybackApis.PutBuybackApproval({
                buyback_id: id,
                status,
                note,
            });
            handleCloseModal();
            fetchData(paramFetch.current_page, paramFetch.per_page, filterBounce);

            showAlert({
                icon: status === 'DISETUJUI' ? 'success' : 'error',
                isAutoClose: true,
                title: status === 'DISETUJUI' ? 'Berhasil Disetujui' : 'Berhasil Ditolak',
                message: status === 'DISETUJUI'
                    ? 'Transaksi buyback telah dicatat dan stok inventory telah diperbarui.'
                    : 'Transaksi buyback telah ditolak dan tidak akan diproses lebih lanjut.',
            });
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Terjadi kesalahan saat memproses data' });
        } finally {
            setLoading(false);
        }
    };

    const confirmApprove = (id) => {
        showAlert({
            icon: 'success',
            isAutoClose: false,
            title: 'Setujui Buyback',
            message: 'Transaksi buyback akan dicatat ke dalam sistem. Kasir dapat melanjutkan proses transaksi setelah persetujuan diberikan.',
            confirmText: 'Setujui',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) {
                updateStatus(id, 'DISETUJUI');
            }
        });
    };

    const confirmReject = (id) => {
        showAlert({
            icon: 'error',
            isAutoClose: false,
            title: 'Tolak Buyback',
            message: 'Anda akan menolak transaksi buyback ini.',
            textarea: true,
            placeholder: 'Masukkan alasan penolakan',
            confirmText: 'Tolak',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) {
                updateStatus(id, 'DITOLAK', res.value);
            }
        });
    };

    const handleApprove = () => {
        if (!selectedData) return;
        confirmApprove(selectedData.id);
    };

    const handleReject = () => {
        if (!selectedData) return;
        confirmReject(selectedData.id);
    };

    const columns = [
        {
            header: 'Tanggal',
            accessor: 'created_at',
            render: (row) => row.created_at ? dayjs(row.created_at).format('DD/MM/YYYY') : '-',
        },
        { header: 'Buyback ID', accessor: 'order_id' },
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
        { header: 'Cabang', accessor: 'branch', render: (row) => row.branch?.branch_name ?? '-' },
        {
            header: 'Status',
            accessor: 'approval_status',
            render: (row) => (
                <Badge tone={STATUS_TONE[row.approval_status] || 'gray'}>
                    {STATUS_LABEL[row.approval_status] || row.approval_status}
                </Badge>
            )
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <ActionButton variant="view" title="Lihat Detail" onClick={() => handleOpenModal(row)} />
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <HeaderSection
                title="Approval Buyback"
                description="Verifikasi detail transaksi buyback sebelum menyetujui proses transaksi."
                icon={CheckSquareOffsetIcon}
            />

            <FilterBar
                value={filter}
                onChange={setFilter}
                fields={[
                    { name: "search", type: "search", placeholder: "Cari kode..." },
                    {
                        name: "status", type: "dropdown", placeholder: "Pilih status", options: [
                            { value: 'APPROVAL', label: 'Approval' },
                            { value: 'DISETUJUI', label: 'Disetujui' },
                            { value: 'DITOLAK', label: 'Ditolak' },
                            { value: 'DIBATALKAN', label: 'Dibatalkan' },
                        ]
                    },
                    { name: "cabang", type: "dropdown", placeholder: "Pilih cabang", options: branchOptions },
                ]}
            />

            <Table
                columns={columns}
                data={filteredData}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={(page) => {
                    setQuery({ page, per_page: paramFetch.per_page });
                    fetchData(page, paramFetch.per_page, filterBounce);
                }}
                onPageSizeChange={(pageSize) => {
                    setQuery({ page: 1, per_page: pageSize });
                    fetchData(1, pageSize, filterBounce);
                }}
            />

            <ModalDetailBuyback
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={can('update') ? handleApprove : undefined}
                onSubmitReject={can('update') ? handleReject : undefined}
                data={selectedData}
            />
        </div>
    );
};

export default ApprovalBuyback;
