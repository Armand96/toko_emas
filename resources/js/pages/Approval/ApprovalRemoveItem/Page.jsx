import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { EyeIcon, CheckSquareOffsetIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailRemoveItem from "./Modal";
import { showAlert } from '../../../utils/showAlert';
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";
import InventoryApis from "../../../Services/Inventory.apis";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";

const JENIS_LABEL = { HILANG: 'Hilang', REPAIR: 'Repair' };

const ApprovalRemoveItem = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [filter, setFilter] = useState({ search: '', cabang: '' });
    const [filterBounce] = useDebounce(filter, 500);
    const [firstLoading, setFirstLoading] = useState(false);
    const [branchOptions, setBranchOptions] = useState([]);
    const [productMap, setProductMap] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                per_page: pageSize,
                status: 'APPROVAL',
            });
            if (params.search) query.append('code', params.search);
            if (params.cabang) query.append('branch_id', params.cabang);

            const res = await InventoryApis.GetRemoveItem(`?${query.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ensureBranches()
            .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")));

        ensureProducts()
            .then((data) => {
                const map = {};
                data.forEach((p) => { map[p.id] = p.product_name; });
                setProductMap(map);
            });

        fetchData();
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, filterBounce);
        }
    }, [filterBounce]);



    const handleOpenModal = async (row) => {
        setLoading(true);
        try {
            const res = await InventoryApis.GetRemoveItemSingle(row.id);
            const detail = res?.data || res;
            if (detail?.details) {
                detail.details = detail.details.map((d) => ({
                    ...d,
                    product: d.product || (productMap[d.product_id] ? { product_name: productMap[d.product_id] } : null),
                }));
            }
            setSelectedData(detail);
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal memuat detail remove item' });
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
            await InventoryApis.UpdateRemoveItem({ remove_id: id, status, note });
            handleCloseModal();
            fetchData(paramFetch.current_page, paramFetch.per_page, filterBounce);

            showAlert({
                icon: status === 'DISETUJUI' ? 'success' : 'error',
                isAutoClose: true,
                title: status === 'DISETUJUI' ? 'Berhasil Disetujui' : 'Berhasil Ditolak',
                message: status === 'DISETUJUI'
                    ? 'Item telah dikeluarkan dari inventory aktif cabang.'
                    : 'Remove item telah ditolak dan tidak akan diproses lebih lanjut.',
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
            title: 'Setujui Remove Item',
            message: 'Anda akan menyetujui remove item ini. Status item akan diperbarui sesuai jenis remove yang dipilih.',
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
            title: 'Tolak Remove Item',
            message: 'Anda akan menolak remove item ini.',
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
        { header: 'Kode', accessor: 'code', render: (row) => row.code || '-' },
        {
            header: 'Item Produk',
            accessor: 'details',
            render: (row) => {
                const items = row.details || [];
                if (items.length === 0) return '-';
                const names = items
                    .map((d) => {
                        const name = d.product?.product_name || productMap[d.product_id];
                        return name ? `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ?? ''}K` : d.inventory_code;
                    })
                    .filter(Boolean);
                return names.join(', ');
            },
        },
        { header: 'Cabang', accessor: 'branch', render: (row) => row.branch?.name ?? '-' },
        { header: 'Jenis', accessor: 'jenis', render: (row) => JENIS_LABEL[row.jenis] || row.jenis || '-' },
        {
            header: 'Status',
            accessor: 'status',
            render: () => (
                <span className="px-3 py-1 rounded-md text-xs font-medium border bg-warning-50 text-warning-600 border-warning-200">
                    Approval
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
                title="Approval Remove Item"
                description="Verifikasi detail item inventory sebelum menyetujui proses remove item dari inventory aktif."
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
                data={paramFetch.data}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={(page) => fetchData(page, paramFetch.per_page, filterBounce)}
                onPageSizeChange={(pageSize) => fetchData(1, pageSize, filterBounce)}
            />

            <ModalDetailRemoveItem
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmitApprove={can('update', 'approval.remove_item') ? handleApprove : undefined}
                onSubmitReject={can('update', 'approval.remove_item') ? handleReject : undefined}
                data={selectedData}
            />
        </div>
    );
};

export default ApprovalRemoveItem;
