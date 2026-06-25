import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from "use-debounce";
import { PlusCircleIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailRemove from './ModalView';
import InventoryApis from "../../../Services/Inventory.apis";
import { showAlert } from "../../../utils/showAlert";
import HelperFunctions from "../../../utils/HelperFunctions";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";
import AuthStore from "../../../Store/AuthStore";

const Main = ({ setCurentState }) => {
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const [filterData, setFilterData] = useState({ search: '', status: '', cabang: '' });
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [branchOptions, setBranchOptions] = useState([]);
    const [productMap, setProductMap] = useState({});

    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);

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
            if (filters.search) params.append('code', filters.search);
            if (filters.status) params.append('status', filters.status);
            const effectiveBranch = isKasir() && user?.branch_id ? user.branch_id : filters.cabang;
            if (effectiveBranch) params.append('branch_id', effectiveBranch);

            const res = await InventoryApis.GetRemoveItem(`?${params.toString()}`);
            const raw = res?.data || [];
            const meta = res?.meta || res;

            const rows = raw.map((item) => {
                const productNames = (item.details || [])
                    .map((d) => {
                        const p = d.product;
                        return p ? `${p.name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ?? ''}` : d.inventory_code;
                    })
                    .join(', ');

                return {
                    id: item.id,
                    tanggal: item.created_at
                        ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '-',
                    kode: item.code,
                    item_produk: productNames || '-',
                    cabang: item.branch?.name || '-',
                    jenis: item.jenis === 'HILANG' ? 'Hilang' : item.jenis === 'REPAIR' ? 'Repair' : item.jenis,
                    status: (() => {
                        const map = { APPROVAL: 'Approval', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan', RETURN: 'Return' };
                        return map[item.status] || item.status;
                    })(),
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
    }, []);

    useEffect(() => {
        ensureBranches()
            .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")));

        // Backend tidak eager-load details.product, jadi nama produk diresolve di FE via product_id.
        ensureProducts()
            .then((data) => {
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
            const res = await InventoryApis.GetRemoveItemSingle(row.id);
            const item = res?.data || res;

            const items = (item.details || []).map((d) => {
                const inv = d.inventory || {};
                return {
                    kode: d.inventory_code,
                    image: inv.image_path ? HelperFunctions.getStorageUrl(inv.image_path) : null,
                    nama: d.product?.product_name || d.product?.name || productMap[d.product_id] || '-',
                    berat: inv.berat ? `${inv.berat}g` : '-',
                    karat: inv.karat ? `${inv.karat}K` : '-',
                    harga_jual: inv.jual || 0,
                };
            });

            const statusMap = { APPROVAL: 'Approval', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan', RETURN: 'Return' };
            const jenisMap = { HILANG: 'Hilang', REPAIR: 'Repair' };

            setSelectedDetail({
                id: item.id,
                kode_transaksi: item.code,
                jenis: jenisMap[item.jenis] || item.jenis,
                catatan: item.note || '-',
                diajukan_oleh: item.created_by_user?.name || item.user?.name || '-',
                pic_approval: item.status === 'DIBATALKAN' ? (item.user?.name || '-') : 'Owner',
                tanggal_approval: item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-',
                status: statusMap[item.status] || item.status,
                alasan: item.note_approval || null,
                items,
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
            // fallback to row data
            setSelectedDetail(row);
            setIsModalOpen(true);
        }
    };

    const handleCancel = async (row) => {
        const { confirmed } = await showAlert({
            title: 'Batalkan Remove Item',
            message: `Apakah Anda yakin ingin membatalkan ${row.kode}?`,
            icon: 'warning',
            confirmText: 'Ya, Batalkan',
            cancelText: 'Tidak',
        });
        if (!confirmed) return;

        try {
            await InventoryApis.UpdateRemoveItem({ status: 'DIBATALKAN', note: null, remove_id: row.id });
            await showAlert({ title: 'Berhasil', message: 'Remove item berhasil dibatalkan.', icon: 'success', confirmText: 'OK' });
            fetchData(paramFetch.page, paramFetch.pageSize, filterData);
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Gagal', message: 'Terjadi kesalahan saat membatalkan.', icon: 'error', confirmText: 'OK' });
        }
    };

    const REMOVE_STATUS_OPTIONS = [
        { label: 'Disetujui', value: 'DISETUJUI' },
        { label: 'Approval', value: 'APPROVAL' },
        { label: 'Ditolak', value: 'DITOLAK' },
        { label: 'Dibatalkan', value: 'DIBATALKAN' },
    ];

    const columns = [
        { header: 'Tanggal Out', accessor: 'tanggal' },
        { header: 'Kode', accessor: 'kode' },
        {
            header: 'Item Produk', accessor: 'item_produk',
            render: (row) => {
                const details = row._raw?.details || [];
                if (details.length === 0) return row.item_produk || '-';
                const names = details
                    .map((d) => {
                        const name = d.product?.name || productMap[d.product_id];
                        return name ? `${name} ${d.inventory?.berat ?? ''}g ${d.inventory?.karat ?? ''}` : d.inventory_code;
                    })
                    .filter(Boolean);
                return names.join(', ') || '-';
            },
        },
        { header: 'Cabang', accessor: 'cabang' },
        { header: 'Jenis', accessor: 'jenis' },
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
                    {row.status === 'Approval' && can('delete', 'inventory.remove') && (
                        <ActionButton variant="cancel" onClick={() => handleCancel(row)} />
                    )}
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewDetail(row)} />
                </ActionButtonGroup>
            )
        },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6">
            <HeaderSection
                title="Remove Item"
                description="Kelola proses barang keluar dari ready stock berdasarkan jenis transaksi."
                icon={PlusCircleIcon}
                textButton="Remove Item"
                onClick={can('create', 'inventory.remove') ? () => setCurentState('form') : undefined}
            />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{ name: 'search', label: '', type: 'search', placeholder: 'Cari kode/nama/berat/karat...' }]}
                        formData={filterData}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="w-[160px]">
                    <InputGroup
                        fields={[{ name: 'status', label: '', type: 'dropdown', placeholder: 'Pilih status', options: REMOVE_STATUS_OPTIONS }]}
                        formData={filterData}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
                {!isKasir() && (
                    <div className="w-[160px]">
                        <InputGroup
                            fields={[{ name: 'cabang', label: '', type: 'dropdown', placeholder: 'Pilih cabang', options: branchOptions }]}
                            formData={filterData}
                            cols="1"
                            onChange={handleFilterChange}
                        />
                    </div>
                )}
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
            <ModalDetailRemove
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={selectedDetail}
            />
        </div>
    );
};

export default Main;
