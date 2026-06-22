import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { EyeIcon, CheckSquareOffsetIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailPenjualan from "./Modal";
import { showAlert } from '../../../utils/showAlert';
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import PenjualanApis from "../../../Services/Penjualan.apis";
import PermissionStore from "../../../Store/PermissionStore";
import OptionsStore from "../../../Store/OptionsStore";

const STATUS_STYLE = {
    'APPROVAL': 'bg-warning-50 text-warning-600 border-warning-200',
    'DISETUJUI': 'bg-success-50 text-success-700 border-success-200',
    'CETAK KWITANSI': 'bg-info-50 text-info-700 border-info-200',
    'SELESAI': 'bg-success-50 text-success-700 border-success-200',
    'DITOLAK': 'bg-danger-50 text-danger-600 border-danger-200',
    'DIBATALKAN': 'bg-danger-50 text-danger-600 border-danger-200',
};

const STATUS_LABEL = {
    'APPROVAL': 'Approval',
    'DISETUJUI': 'Disetujui',
    'CETAK KWITANSI': 'Cetak Kwitansi',
    'SELESAI': 'Selesai',
    'DITOLAK': 'Ditolak',
    'DIBATALKAN': 'Dibatalkan',
};

const ApprovalPenjualan = () => {
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

    const [filter, setFilter] = useState({ search: '', cabang: '' });
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
                approval_status: 'APPROVAL',
                status: 'APPROVAL',
            });
            if (params.search) query.append('order_id', params.search);
            if (params.cabang) query.append('branch_id', params.cabang);

            const res = await PenjualanApis.GetPenjualan(`?${query.toString()}`);
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
        ensureBranches()
            .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")));
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, filterBounce);
        }
    }, [filterBounce]);



    const filteredData = (paramFetch.data || []).filter((row) => {
        const matchCabang = !filter.cabang || row.branch?.branch_name === filter.cabang;
        return matchCabang;
    });

    const handleOpenModal = async (row) => {
        setLoading(true);
        try {
            const res = await PenjualanApis.GetPenjualanDetail(row.id);
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
            await PenjualanApis.PutPenjualanApproval({
                penjualan_id: id,
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
                    ? 'Transaksi penjualan telah dicatat dan stok inventory telah diperbarui.'
                    : 'Transaksi penjualan telah ditolak dan tidak akan diproses lebih lanjut.',
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
            title: 'Setujui Penjualan',
            message: 'Transaksi akan dicatat ke dalam sistem dan stok inventory akan diperbarui sesuai item yang terjual.',
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
            title: 'Tolak Penjualan',
            message: 'Anda akan menolak transaksi penjualan ini.',
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
        { header: 'Nominal', accessor: 'grand_total', render: (row) => HelperFunctions.formatCurrency(row.grand_total || 0) },
        { header: 'Pembayaran', accessor: 'payment_type', render: (row) => row.payment_type === 'TUNAI' ? 'Tunai' : 'Transfer' },
        { header: 'User', accessor: 'user', render: (row) => row.user?.name ?? '-' },
        { header: 'Cabang', accessor: 'branch', render: (row) => row.branch?.branch_name ?? '-' },
        {
            header: 'Status',
            accessor: 'approval_status',
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${STATUS_STYLE[row.approval_status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {STATUS_LABEL[row.approval_status] || row.approval_status}
                </span>
            )
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <button
                    onClick={() => handleOpenModal(row)}
                    className="p-1.5 bg-white border border-neutral-200 text-primary-600 rounded-md hover:bg-neutral-50 transition-colors"
                    title="Lihat Detail"
                >
                    <EyeIcon size={18} />
                </button>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <HeaderSection
                title="Approval Penjualan"
                description="Verifikasi detail transaksi penjualan sebelum menyetujui proses transaksi."
                icon={CheckSquareOffsetIcon}
            />

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{
                            name: "search",
                            label: "",
                            type: "search",
                            placeholder: "Cari transaksi..",
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
                <div className="w-[160px]">
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
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                data={filteredData}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={(page) => fetchData(page, paramFetch.per_page, filterBounce)}
                onPageSizeChange={(pageSize) => fetchData(1, pageSize, filterBounce)}
            />

            <ModalDetailPenjualan
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={can('update', 'approval.penjualan') ? handleApprove : undefined}
                onSubmitReject={can('update', 'approval.penjualan') ? handleReject : undefined}
                data={selectedData}
            />
        </div>
    );
};

export default ApprovalPenjualan;
