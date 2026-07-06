import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from "use-debounce";
import { PlusCircleIcon } from "@phosphor-icons/react";
import ActionButton, { ActionButtonGroup } from "../../../components/ActionButton";
import Badge from "../../../components/Badge";
import { useQueryParams } from "../../../utils/useQueryParams";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import FilterBar from "../../../components/FilterBar";
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from "../../../utils/HelperFunctions";
import OptionsStore from "../../../Store/OptionsStore";
import PermissionStore from "../../../Store/PermissionStore";
import AuthStore from "../../../Store/AuthStore";

const Main = ({ setCurentState }) => {
    const can = PermissionStore((s) => s.can);
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const [
        { search: urlSearch, status: urlStatus, cabang: urlCabang, page: urlPage, per_page: urlPerPage },
        setQuery,
    ] = useQueryParams({ search: '', status: '', cabang: '', page: 1, per_page: 10 });
    const [filterData, setFilterData] = useState({ search: urlSearch, status: urlStatus, cabang: urlCabang, dateRange: null });
    const [isLoading, setIsLoading] = useState(false);
    const [branchOptions, setBranchOptions] = useState([]);

    const ensureBranches = OptionsStore((s) => s.ensureBranches);

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
            if (filters.search) params.append('kode_sesi', filters.search);
            if (filters.status) params.append('status', filters.status);
            const effectiveBranch = isKasir() && user?.branch_id ? user.branch_id : filters.cabang;
            if (effectiveBranch) params.append('branch_id', effectiveBranch);
            const { mode, start, end } = filters.dateRange || {};
            if (mode !== 'all' && start && end) {
                params.append('start_date', start);
                params.append('end_date', end);
            }

            const res = await InventoryApis.GetStockOpname(`?${params.toString()}`);
            const raw = res?.data || [];
            const meta = res?.meta || res;

            const rows = raw.map((item) => ({
                id: item.id,
                tanggal: item.created_at
                    ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '-',
                kode: item.kode_sesi,
                cabang: item.branch?.branch_name || '-',
                total: item.total_item,
                sesuai: item.in_stock,
                missing: item.missing,
                extra: item.extra,
                status: item.status === 'SESUAI' ? 'Sesuai' : 'Selisih',
                _raw: item,
            }));

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

        fetchData(urlPage, urlPerPage, { search: urlSearch, status: urlStatus, cabang: urlCabang });
    }, []);

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        setQuery({ search: filterBounce.search, status: filterBounce.status, cabang: filterBounce.cabang, page: 1 });
        fetchData(1, paramFetch.pageSize, filterBounce);
        setParamFetch(prev => ({ ...prev, page: 1 }));
    }, [filterBounce]);

    const handleViewDetail = (row) => {
        setCurentState({ view: 'detail', id: row.id });
    };

    const OPNAME_STATUS_OPTIONS = [
        { label: 'Sesuai', value: 'SESUAI' },
        { label: 'Selisih', value: 'SELISIH' },
    ];

    const columns = [
        { header: 'Tanggal Sesi', accessor: 'tanggal' },
        { header: 'Kode Sesi', accessor: 'kode' },
        { header: 'Cabang', accessor: 'cabang' },
        { header: 'Total Item', accessor: 'total' },
        { header: 'Sesuai', accessor: 'sesuai' },
        { header: 'Missing', accessor: 'missing' },
        { header: 'Extra', accessor: 'extra' },
        {
            header: 'Status', accessor: 'status',
            render: (row) => (
                <Badge tone={row.status === 'Sesuai' ? 'success' : 'danger'}>
                    {row.status}
                </Badge>
            )
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <ActionButtonGroup>
                    <ActionButton variant="view" title="Lihat Detail" onClick={() => handleViewDetail(row)} />
                </ActionButtonGroup>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Stock Opname"
                description="Kelola proses stock opname untuk memastikan kesesuaian stok fisik dan sistem."
                icon={PlusCircleIcon}
                textButton="Input Sesi Stock Opname"
                onClick={can('create') ? () => setCurentState({ view: 'form' }) : undefined}
            />
            <FilterBar
                value={filterData}
                onChange={setFilterData}
                fields={[
                    { name: 'dateRange', type: 'daterange', width: 'sm:w-auto sm:min-w-[220px]' },
                    { name: 'search', type: 'search', placeholder: 'Cari kode sesi...' },
                    { name: 'status', type: 'dropdown', placeholder: 'Pilih status', options: OPNAME_STATUS_OPTIONS },
                    !isKasir() && { name: 'cabang', type: 'dropdown', placeholder: 'Pilih cabang', options: branchOptions },
                ]}
            />
            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.page}
                pageSize={paramFetch.pageSize}
                total={paramFetch.total}
                isLoading={isLoading}
                onPageChange={(page) => {
                    setParamFetch(prev => ({ ...prev, page }));
                    setQuery({ page, per_page: paramFetch.pageSize });
                    fetchData(page, paramFetch.pageSize, filterData);
                }}
                onPageSizeChange={(pageSize) => {
                    setParamFetch(prev => ({ ...prev, pageSize, page: 1 }));
                    setQuery({ page: 1, per_page: pageSize });
                    fetchData(1, pageSize, filterData);
                }}
            />
        </div>
    );
};

export default Main;
