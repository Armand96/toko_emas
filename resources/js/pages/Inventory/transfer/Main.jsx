import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from "use-debounce";
import { PlusCircle } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import CodeBadge from "../../../components/CodeBadge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailTransfer from './ModalView';
import InventoryApis from "../../../Services/Inventory.apis";
import { showAlert } from "../../../utils/showAlert";
import HelperFunctions from "../../../utils/HelperFunctions";
import OptionsStore from "../../../Store/OptionsStore";
import AuthStore from "../../../Store/AuthStore";
import PermissionStore from "../../../Store/PermissionStore";

const STATUS_MAP = { APPROVAL: 'Approval', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' };

const Main = ({ setCurentState }) => {
    const user = AuthStore((s) => s.user);
    const can = PermissionStore((s) => s.can);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);

    const [filterData, setFilterData] = useState({ search: '', status: 'APPROVAL' });
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [branchMap, setBranchMap] = useState({});
    const [productMap, setProductMap] = useState({});

    const [paramFetch, setParamFetch] = useState({
        data: [],
        page: 1,
        pageSize: 10,
        total: 0,
    });

    const [filterBounce] = useDebounce(filterData, 500);
    const didMount = useRef(false);

    const fetchData = useCallback(async (page = 1, pageSize = 10, filters = filterData) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('per_page', pageSize);
            if (user?.branch_id) params.append('branch_source_id', user.branch_id);
            if (filters.search) params.append('kode_transfer', filters.search);
            if (filters.status) params.append('status', filters.status);

            const res = await InventoryApis.GetTransferItem(`?${params.toString()}`);
            const raw = res?.data || [];
            const meta = res?.meta || res;

            const rows = raw.map((item) => {
                const productNames = (item.details || [])
                    .map((d) => {
                        const name = productMap[d.product_id] || d.product?.product_name || d.product?.name || d.inventory_code;
                        return `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ? `${d.inventory.karat}K` : ''}`;
                    })
                    .join(', ');

                return {
                    id: item.id,
                    tanggal: item.created_at
                        ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '-',
                    kode: item.kode_transfer,
                    item_produk: productNames || '-',
                    cabang_asal: item.branch_source?.branch_name || item.branch_source?.name || '-',
                    cabang_tujuan: item.branch_dest?.branch_name || item.branch_dest?.name || '-',
                    status: STATUS_MAP[item.status] || item.status,
                    _raw: item,
                };
            });

            setParamFetch({
                data: rows,
                page: meta?.current_page || page,
                pageSize: meta?.per_page || pageSize,
                total: meta?.total || rows.length,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [user, productMap]);

    useEffect(() => {
        ensureBranches().then((data) => {
            const map = {};
            data.forEach((b) => { map[b.id] = b.branch_name; });
            setBranchMap(map);
        });
        ensureProducts().then((data) => {
            const map = {};
            data.forEach((p) => { map[p.id] = p.product_name; });
            setProductMap(map);
        });
        fetchData(paramFetch.page, paramFetch.pageSize, filterData);
    }, []);

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        fetchData(1, paramFetch.pageSize, filterBounce);
        setParamFetch(prev => ({ ...prev, page: 1 }));
    }, [filterBounce]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const handleViewDetail = async (row) => {
        try {
            const res = await InventoryApis.GetTransferItemSingle(row.id);
            const item = res?.data || res;

            const items = (item.details || []).map((d) => {
                const inv = d.inventory || {};
                return {
                    kode: d.inventory_code,
                    image: inv.image_path ? HelperFunctions.getStorageUrl(inv.image_path) : null,
                    nama: productMap[d.product_id] || d.product?.product_name || inv.product?.product_name || '-',
                    berat: inv.berat ? `${inv.berat}g` : '-',
                    karat: inv.karat ? `${inv.karat}K` : '-',
                    harga_jual: inv.jual || 0,
                };
            });

            setSelectedDetail({
                id: item.id,
                kode_transaksi: item.kode_transfer,
                kode: item.kode_transfer,
                cabang_asal: item.branch_source?.branch_name || item.branch_source?.name || '-',
                cabang_tujuan: item.branch_dest?.branch_name || item.branch_dest?.name || '-',
                catatan: item.note || '-',
                diajukan_oleh: item.user?.name || '-',
                pic_approval: item.status === 'DIBATALKAN' ? (item.user?.name || '-') : 'Owner',
                tanggal: item.created_at
                    ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-',
                tanggal_approval: item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-',
                status: STATUS_MAP[item.status] || item.status,
                alasan: item.note_approval || null,
                items,
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
            setSelectedDetail(row);
            setIsModalOpen(true);
        }
    };

    const handleCancel = async (row) => {
        const { confirmed } = await showAlert({
            title: 'Batalkan Transfer Item',
            message: `Apakah Anda yakin ingin membatalkan transfer item ini? Transaksi yang dibatalkan tidak dapat diproses.`,
            icon: 'warning',
            confirmText: 'Lanjut Batalkan',
            cancelText: 'Batal',
        });
        if (!confirmed) return;

        try {
            await InventoryApis.UpdateTransferItem({ status: 'DIBATALKAN', note: null, transfer_item_id: row.id });
            await showAlert({ title: 'Berhasil Dibatalkan', message: 'Transfer item telah dibatalkan.', icon: 'success', isAutoClose: true });
            fetchData(paramFetch.page, paramFetch.pageSize, filterData);
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Gagal', message: 'Terjadi kesalahan saat membatalkan.', icon: 'error', confirmText: 'OK' });
        }
    };

    const TRANSFER_STATUS_OPTIONS = [
        { label: 'Disetujui', value: 'DISETUJUI' },
        { label: 'Approval', value: 'APPROVAL' },
        { label: 'Ditolak', value: 'DITOLAK' },
        { label: 'Dibatalkan', value: 'DIBATALKAN' },
    ];

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal' },
        { header: 'Kode', accessor: 'kode', render: (row) => <CodeBadge variant="table">{row.kode}</CodeBadge> },
        {
            header: 'Item Produk', accessor: 'item_produk',
            render: (row) => {
                const details = row._raw?.details || [];
                if (details.length === 0) return row.item_produk || '-';
                const names = details
                    .map((d) => {
                        const name = d.product?.name || d.product?.product_name || productMap[d.product_id];
                        return name ? `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ? `${d.inventory.karat}K` : ''}` : d.inventory_code;
                    })
                    .filter(Boolean);
                if (names.length === 0) return '-';
                if (names.length <= 3) return names.join(', ');
                return `${names.slice(0, 3).join(', ')} +${names.length - 3} lainnya`;
            },
        },
        { header: 'Cabang Asal', accessor: 'cabang_asal' },
        { header: 'Cabang Tujuan', accessor: 'cabang_tujuan' },
        {
            header: 'Status', accessor: 'status',
            render: (row) => {
                let tone = 'gray';
                if (row.status === 'Disetujui') tone = 'success';
                else if (row.status === 'Approval') tone = 'warning';
                else if (row.status === 'Ditolak' || row.status === 'Dibatalkan') tone = 'danger';
                return <Badge tone={tone}>{row.status}</Badge>;
            }
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    {row.status === 'Approval' && can('delete', 'inventory.transfer') && (
                        <ActionButton variant="cancel" onClick={() => handleCancel(row)} />
                    )}
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewDetail(row)} />
                </ActionButtonGroup>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Transfer Item"
                description="Catat dan kelola transfer item inventory antar cabang."
                icon={PlusCircle}
                textButton="Transfer"
                onClick={can('create', 'inventory.transfer') ? () => setCurentState('form') : undefined}
            />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{ name: 'search', label: '', type: 'search', placeholder: 'Cari kode...' }]}
                        formData={filterData}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="w-[160px]">
                    <InputGroup
                        fields={[{ name: 'status', label: '', type: 'dropdown', placeholder: 'Pilih status', options: TRANSFER_STATUS_OPTIONS }]}
                        formData={filterData}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
            </div>
            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.page}
                pageSize={paramFetch.pageSize}
                total={paramFetch.total}
                isLoading={isLoading}
                onPageChange={(page) => {
                    setParamFetch(prev => ({ ...prev, page }));
                    fetchData(page, paramFetch.pageSize, filterData);
                }}
                onPageSizeChange={(pageSize) => {
                    setParamFetch(prev => ({ ...prev, pageSize, page: 1 }));
                    fetchData(1, pageSize, filterData);
                }}
            />
            <ModalDetailTransfer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={selectedDetail}
            />
        </div>
    );
};

export default Main;
