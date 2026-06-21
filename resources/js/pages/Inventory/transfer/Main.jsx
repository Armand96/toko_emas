import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from "use-debounce";
import { PlusCircle, Eye, X } from "@phosphor-icons/react";
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

    const [filterData, setFilterData] = useState({ search: '', status: '' });
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
                        return `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ?? ''}`;
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
                    karat: inv.karat || '-',
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
                pic_approval: '-',
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

    const filterFields = [
        { name: 'search', type: 'text', placeholder: 'Cari produk...', deskSpan: 2 },
        {
            name: 'status', type: 'dropdown', placeholder: 'Pilih status', deskSpan: 1,
            options: [
                { label: 'Disetujui', value: 'DISETUJUI' },
                { label: 'Approval', value: 'APPROVAL' },
                { label: 'Ditolak', value: 'DITOLAK' },
                { label: 'Dibatalkan', value: 'DIBATALKAN' },
            ],
        },
    ];

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal', sortable: true },
        { header: 'Kode', accessor: 'kode', sortable: true },
        {
            header: 'Item Produk', accessor: 'item_produk', sortable: true,
            render: (row) => {
                const details = row._raw?.details || [];
                if (details.length === 0) return row.item_produk || '-';
                const names = details
                    .map((d) => {
                        const name = d.product?.name || d.product?.product_name || productMap[d.product_id];
                        return name ? `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ?? ''}` : d.inventory_code;
                    })
                    .filter(Boolean);
                return names.join(', ') || '-';
            },
        },
        { header: 'Cabang Asal', accessor: 'cabang_asal', sortable: true },
        { header: 'Cabang Tujuan', accessor: 'cabang_tujuan', sortable: true },
        {
            header: 'Status', accessor: 'status', sortable: true,
            render: (row) => {
                let badgeClass = 'bg-gray-50 text-gray-700 border-gray-200';
                if (row.status === 'Disetujui') badgeClass = 'bg-success-50 text-success-700 border-success-200';
                else if (row.status === 'Approval') badgeClass = 'bg-warning-50 text-warning-700 border-warning-200';
                else if (row.status === 'Ditolak' || row.status === 'Dibatalkan') badgeClass = 'bg-danger-50 text-danger-700 border-danger-200';
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${badgeClass}`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.status === 'Approval' && can('delete', 'inventory.transfer') && (
                        <button
                            onClick={() => handleCancel(row)}
                            className="p-1.5 text-danger-500 hover:bg-danger-50 border border-danger-200 rounded-md transition-colors cursor-pointer"
                            title="Batalkan"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    )}
                    <button
                        onClick={() => handleViewDetail(row)}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail"
                    >
                        <Eye size={16} weight="bold" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6">
            <HeaderSection
                title="Transfer Item"
                description="Catat dan kelola transfer item inventory antar cabang."
                icon={PlusCircle}
                textButton="Transfer"
                onClick={can('create', 'inventory.transfer') ? () => setCurentState('form') : undefined}
            />
            <div className="w-full md:w-1/2">
                <InputGroup
                    fields={filterFields}
                    formData={filterData}
                    onChange={handleFilterChange}
                    cols="3"
                />
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
