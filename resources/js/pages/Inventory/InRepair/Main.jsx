import { useState, useEffect, useRef } from 'react';
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import { ArrowRight } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailRemoveItem from "../../Approval/ApprovalRemoveItem/Modal";
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from "../../../utils/HelperFunctions";
import { showAlert } from "../../../utils/showAlert";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";
import AuthStore from "../../../Store/AuthStore";
import LoadingStore from "../../../Store/LoadingStore";

const Main = () => {
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const setLoading = LoadingStore((s) => s.setLoading);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);

    const [filterData, setFilterData] = useState({ search: '' });
    const [filterBounce] = useDebounce(filterData, 500);
    const didMount = useRef(false);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const [productMap, setProductMap] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);

    const fetchData = async (page = 1, pageSize = 10, filters = filterData) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                per_page: pageSize,
                jenis: 'REPAIR',
                status: 'DISETUJUI',
            });
            if (filters.search) params.append('code', filters.search);
            if (isKasir() && user?.branch_id) params.append('branch_id', user.branch_id);

            const res = await InventoryApis.GetRemoveItem(`?${params.toString()}`);
            setParamFetch(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ensureProducts()
            .then((data) => {
                const map = {};
                data.forEach((p) => { map[p.id] = p.product_name; });
                setProductMap(map);
            });
        fetchData();
    }, []);

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        fetchData(1, paramFetch.per_page, filterBounce);
    }, [filterBounce]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const handleViewDetail = async (row) => {
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
        } catch (err) {
            console.error(err);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal memuat detail item repair' });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedData(null);
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
            fetchData(paramFetch.current_page, paramFetch.per_page, filterData);
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengembalikan item.';
            showAlert({ title: 'Gagal', message: msg, icon: 'error', confirmText: 'OK' });
        }
    };

    const getLamaRepair = (createdAt) => {
        if (!createdAt) return '-';
        const diff = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
        return `${diff} Hari`;
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
        {
            header: 'Lama Repair',
            accessor: 'lama_repair',
            render: (row) => getLamaRepair(row.created_at),
        },
        { header: 'Cabang', accessor: 'branch', render: (row) => row.branch?.branch_name || row.branch?.name || '-' },
        {
            header: 'Status',
            accessor: 'status',
            render: () => <Badge tone="purple">Repair</Badge>,
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewDetail(row)} />
                    {can('update') && (
                        <ActionButton icon={ArrowRight} title="Kembalikan ke Inventory" tone="default" onClick={() => handleReturn(row)} />
                    )}
                </ActionButtonGroup>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Item Repair"
                description="Kelola item inventory yang sedang dalam proses perbaikan dan kembalikan ke inventory aktif setelah repair selesai."
            />
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{
                            name: 'search',
                            label: '',
                            type: 'search',
                            placeholder: 'Cari kode...',
                        }]}
                        formData={filterData}
                        cols="1"
                        onChange={handleFilterChange}
                    />
                </div>
            </div>
            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={(page) => fetchData(page, paramFetch.per_page, filterData)}
                onPageSizeChange={(pageSize) => fetchData(1, pageSize, filterData)}
            />
            <ModalDetailRemoveItem
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                data={selectedData}
            />
        </div>
    );
};

export default Main;
