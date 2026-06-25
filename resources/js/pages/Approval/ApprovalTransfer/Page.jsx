import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CheckSquareOffsetIcon } from "@phosphor-icons/react";
import ActionButton from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import dayjs from "dayjs";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailTransfer from "./Modal";
import { showAlert } from '../../../utils/showAlert';
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import InventoryApis from "../../../Services/Inventory.apis";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";

const STATUS_OPTIONS = [
    { value: 'Approval', label: 'Approval' },
    { value: 'Disetujui', label: 'Disetujui' },
    { value: 'Ditolak', label: 'Ditolak' },
    { value: 'Dibatalkan', label: 'Dibatalkan' },
];
const STATUS_API_MAP = { 'Approval': 'APPROVAL', 'Disetujui': 'DISETUJUI', 'Ditolak': 'DITOLAK', 'Dibatalkan': 'DIBATALKAN' };
const STATUS_DISPLAY = { APPROVAL: 'Approval', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' };

const STATUS_TONE = {
    'Approval': 'warning',
    'Disetujui': 'success',
    'Ditolak': 'danger',
    'Dibatalkan': 'danger',
};

const ApprovalTransfer = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [filter, setFilter] = useState({ search: '', status: '', branch_id: '' });
    const [filterBounce] = useDebounce(filter, 500);
    const [firstLoading, setFirstLoading] = useState(false);
    const [productMap, setProductMap] = useState({});
    const [branchOptions, setBranchOptions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page, per_page: pageSize });
            if (params.status) {
                const statusVal = STATUS_API_MAP[params.status] || params.status;
                query.append('status', statusVal);
            }
            if (params.search) query.append('kode_transfer', params.search);
            if (params.branch_id) query.append('branch_source_id', params.branch_id);

            const res = await InventoryApis.GetTransferItem(`?${query.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ensureProducts().then((data) => {
            const map = {};
            data.forEach((p) => { map[p.id] = p.product_name; });
            setProductMap(map);
        });
        ensureBranches().then((data) => {
            setBranchOptions(HelperFunctions.formatDropdown(data, 'id', 'branch_name'));
        });
        fetchData(1, 10, filter);
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, filterBounce);
        }
    }, [filterBounce]);

    const handleResetFilter = () => setFilter({ search: '', status: '', branch_id: '' });

    const handleOpenModal = async (row) => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetTransferItemSingle(row.id);
            const detail = res?.data || res;
            setSelectedData(detail);
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal memuat detail transfer item' });
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
            await InventoryApis.UpdateTransferItem({ transfer_item_id: id, status, note });
            handleCloseModal();
            fetchData(paramFetch.current_page, paramFetch.per_page, filterBounce);

            showAlert({
                icon: status === 'DISETUJUI' ? 'success' : 'error',
                isAutoClose: true,
                title: status === 'DISETUJUI' ? 'Berhasil Disetujui' : 'Berhasil Ditolak',
                message: status === 'DISETUJUI'
                    ? 'Item telah masuk ke inventory aktif cabang tujuan.'
                    : 'Transfer item telah ditolak dan tidak akan diproses lebih lanjut.',
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
            title: 'Setujui Transfer Item',
            message: 'Anda akan menyetujui transfer item ini. Item akan masuk ke inventory aktif cabang tujuan.',
            confirmText: 'Setujui',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) updateStatus(id, 'DISETUJUI');
        });
    };

    const confirmReject = (id) => {
        showAlert({
            icon: 'error',
            isAutoClose: false,
            title: 'Tolak Transfer Item',
            message: 'Anda akan menolak transfer item ini.',
            textarea: true,
            placeholder: 'Masukkan alasan penolakan',
            confirmText: 'Tolak',
            cancelText: 'Batal',
        }).then((res) => {
            if (res.confirmed) updateStatus(id, 'DITOLAK', res.value);
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
        { header: 'Kode', accessor: 'kode_transfer', render: (row) => row.kode_transfer || '-' },
        {
            header: 'Item Produk',
            accessor: 'details',
            render: (row) => {
                const items = row.details || [];
                if (items.length === 0) return '-';
                const names = items
                    .map((d) => {
                        const name = productMap[d.product_id] || d.product?.product_name || d.product?.name;
                        return name ? `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ?? ''}` : d.inventory_code;
                    })
                    .filter(Boolean);
                return names.join(', ');
            },
        },
        { header: 'Cabang Asal', accessor: 'branch_source', render: (row) => row.branch_source?.branch_name || row.branch_source?.name || '-' },
        { header: 'Cabang Tujuan', accessor: 'branch_dest', render: (row) => row.branch_dest?.branch_name || row.branch_dest?.name || '-' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const display = STATUS_DISPLAY[row.status] || row.status;
                return <Badge tone={STATUS_TONE[display] || 'gray'}>{display}</Badge>;
            }
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
                title="Approval Transfer Item"
                description="Verifikasi detail item dan tujuan cabang sebelum menyetujui proses transfer inventory."
                icon={CheckSquareOffsetIcon}
            />

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
                {[
                    { name: 'status', placeholder: 'Pilih status', options: STATUS_OPTIONS },
                    { name: 'branch_id', placeholder: 'Pilih cabang', options: branchOptions },
                ].map((field) => (
                    <div key={field.name} className="w-[160px]">
                        <InputGroup
                            fields={[{
                                name: field.name,
                                label: "",
                                type: "dropdown",
                                placeholder: field.placeholder,
                                options: field.options,
                            }]}
                            formData={filter}
                            cols="1"
                            onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                        />
                    </div>
                ))}
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={(page) => fetchData(page, paramFetch.per_page, filterBounce)}
                onPageSizeChange={(pageSize) => fetchData(1, pageSize, filterBounce)}
            />

            <ModalDetailTransfer
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={can('update', 'approval.transfer') ? handleApprove : undefined}
                onSubmitReject={can('update', 'approval.transfer') ? handleReject : undefined}
                data={selectedData}
                productMap={productMap}
            />
        </div>
    );
};

export default ApprovalTransfer;
