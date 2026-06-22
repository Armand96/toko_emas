import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from "use-debounce";
import { EyeIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailRemove from "../Remove/ModalView";
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from "../../../utils/HelperFunctions";
import { showAlert } from "../../../utils/showAlert";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";

const Main = () => {
    const can = PermissionStore((s) => s.can);
    const [filterData, setFilterData] = useState({ search: '' });
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [productMap, setProductMap] = useState({});

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
            params.append('jenis', 'REPAIR');
            params.append('status', 'DISETUJUI');
            if (filters.search) params.append('code', filters.search);

            const res = await InventoryApis.GetRemoveItem(`?${params.toString()}`);
            const raw = res?.data || [];
            const meta = res?.meta || res;

            const rows = [];
            for (const item of raw) {
                const details = item.details || [];
                for (const d of details) {
                    const createdAt = new Date(item.created_at);
                    const now = new Date();
                    const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

                    rows.push({
                        id: item.id,
                        detail_id: d.id,
                        inventory_code: d.inventory_code,
                        kode: d.inventory_code,
                        product_id: d.product_id,
                        produk: d.product?.name || '',
                        berat: d.inventory?.berat ? `${d.inventory.berat}g` : '-',
                        karat: d.inventory?.karat || '-',
                        tanggal_repair: createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        lama_repair: `${diffDays} Hari`,
                        cabang: item.branch?.name || '-',
                        status: 'Repair',
                        image: d.inventory?.image_path ? HelperFunctions.getStorageUrl(d.inventory.image_path) : null,
                        _raw: item,
                        _detail: d,
                    });
                }
            }

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
        ensureProducts()
            .then((data) => {
                const map = {};
                data.forEach((p) => { map[p.id] = p.product_name; });
                setProductMap(map);
            });
        fetchData(1, paramFetch.pageSize, filterData);
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
            const items = (item.details || []).map((d) => ({
                kode: d.inventory_code,
                image: d.inventory?.image_path ? HelperFunctions.getStorageUrl(d.inventory.image_path) : null,
                nama: d.product?.name || productMap[d.product_id] || '-',
                berat: d.inventory?.berat ? `${d.inventory.berat}g` : '-',
                karat: d.inventory?.karat || '-',
                harga_jual: d.inventory?.jual || 0,
            }));

            setSelectedDetail({
                id: item.id,
                kode_transaksi: item.code,
                jenis: 'Repair',
                catatan: item.note || '-',
                diajukan_oleh: item.created_by_user?.name || item.user?.name || '-',
                pic_approval: item.approved_by_user?.name || '-',
                tanggal_approval: item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-',
                status: 'Disetujui',
                alasan: null,
                items,
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReturn = async (row) => {
        const { confirmed } = await showAlert({
            title: 'Kembalikan ke Inventory',
            message: 'Apakah Anda yakin ingin mengembalikan item ini ke inventory aktif?',
            icon: 'warning',
            confirmText: 'Kembalikan',
            cancelText: 'Batal',
        });
        if (!confirmed) return;

        try {
            await InventoryApis.UpdateRemoveItem({ status: 'RETURN', note: null, remove_id: row.id });
            await showAlert({ title: 'Berhasil Dikembalikan', message: 'Item telah dikembalikan ke inventory aktif!', icon: 'success', confirmText: 'OK' });
            fetchData(paramFetch.page, paramFetch.pageSize, filterData);
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengembalikan item.';
            showAlert({ title: 'Gagal', message: msg, icon: 'error', confirmText: 'OK' });
        }
    };

    const filterFields = [
        { name: 'search', label: '', type: 'search', placeholder: 'Cari produk...' },
    ];

    const columns = [
        { header: 'Kode', accessor: 'kode', sortable: true },
        {
            header: 'Produk', accessor: 'produk', sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-md flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                        {row.image
                            ? <img src={row.image} alt={row.produk} className="w-full h-full object-cover" />
                            : <span className="text-[10px] text-amber-600">Img</span>
                        }
                    </div>
                    <span className="text-sm font-medium text-gray-800">{productMap[row.product_id] || row.produk || '-'}</span>
                </div>
            )
        },
        { header: 'Berat', accessor: 'berat', sortable: true },
        { header: 'Karat', accessor: 'karat', sortable: true },
        { header: 'Tanggal Repair', accessor: 'tanggal_repair', sortable: true },
        { header: 'Lama Repair', accessor: 'lama_repair', sortable: false },
        { header: 'Cabang', accessor: 'cabang', sortable: true },
        {
            header: 'Status', accessor: 'status', sortable: false,
            render: () => (
                <span className="px-3 py-1 rounded-md text-xs font-medium border bg-warning-50 text-warning-700 border-warning-200">
                    Repair
                </span>
            )
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleViewDetail(row)}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={16} weight="bold" />
                    </button>
                    {can('update', 'inventory.in_repair') && (
                        <button
                            onClick={() => handleReturn(row)}
                            className="p-1.5 text-success-600 hover:bg-success-50 border border-success-200 rounded-md transition-colors cursor-pointer"
                            title="Kembalikan ke Inventory"
                        >
                            <ArrowCounterClockwiseIcon size={16} weight="bold" />
                        </button>
                    )}
                </div>
            )
        },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6">
            <HeaderSection
                title="Item Repair"
                description="Kelola item inventory yang sedang dalam proses perbaikan dan kembalikan ke inventory aktif setelah repair selesai."
            />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={filterFields}
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
            <ModalDetailRemove
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={selectedDetail}
            />
        </div>
    );
};

export default Main;
