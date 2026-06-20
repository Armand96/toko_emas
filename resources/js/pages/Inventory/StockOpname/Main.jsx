import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from "use-debounce";
import { PlusCircleIcon, EyeIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from "../../../utils/HelperFunctions";
import OptionsStore from "../../../Store/OptionsStore";

const Main = ({ setCurentState }) => {
    const [filterData, setFilterData] = useState({ search: '', status: '', cabang: '' });
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
            if (filters.cabang) params.append('branch_id', filters.cabang);

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

    const handleViewDetail = (row) => {
        setCurentState({ view: 'detail', id: row.id });
    };

    const filterFields = [
        { name: 'search', type: 'text', placeholder: 'Cari kode sesi...', deskSpan: 2 },
        {
            name: 'status', type: 'dropdown', placeholder: 'Pilih status', deskSpan: 1,
            options: [
                { label: 'Sesuai', value: 'SESUAI' },
                { label: 'Selisih', value: 'SELISIH' },
            ],
        },
        {
            name: 'cabang', type: 'dropdown', placeholder: 'Pilih cabang', deskSpan: 1,
            options: branchOptions,
        },
    ];

    const columns = [
        { header: 'Tanggal Sesi', accessor: 'tanggal', sortable: true },
        { header: 'Kode Sesi', accessor: 'kode', sortable: true },
        { header: 'Cabang', accessor: 'cabang', sortable: true },
        { header: 'Total Item', accessor: 'total', sortable: true },
        { header: 'Sesuai', accessor: 'sesuai', sortable: true },
        { header: 'Missing', accessor: 'missing', sortable: true },
        { header: 'Extra', accessor: 'extra', sortable: true },
        {
            header: 'Status', accessor: 'status', sortable: true,
            render: (row) => {
                const badgeClass = row.status === 'Sesuai'
                    ? 'bg-success-50 text-success-700 border-success-200'
                    : 'bg-danger-50 text-danger-700 border-danger-200';
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
                    <button
                        onClick={() => handleViewDetail(row)}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={16} weight="bold" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6">
            <HeaderSection
                title="Stock Opname"
                description="Kelola proses stock opname untuk memastikan kesesuaian stok fisik dan sistem."
                icon={PlusCircleIcon}
                textButton="Input Sesi Stock Opname"
                onClick={() => setCurentState({ view: 'form' })}
            />
            <div className="w-full md:w-3/4 xl:w-2/3">
                <InputGroup
                    fields={filterFields}
                    formData={filterData}
                    onChange={handleFilterChange}
                    cols="4"
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
        </div>
    );
};

export default Main;
