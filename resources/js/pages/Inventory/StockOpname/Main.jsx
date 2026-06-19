import { useState } from 'react';
import { PlusCircleIcon, EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import HelperFunctions from "../../../utils/HelperFunctions";

const DUMMY_DATA = [
    { id: 1, tanggal: '11/05/2026', kode: 'OPN-BL1-2605-001', cabang: 'BLOK M 1', total: 500, sesuai: 500, missing: 0, extra: 0, modal: 5460000, jual: 6440000, status: 'Sesuai' },
    { id: 2, tanggal: '10/04/2026', kode: 'OPN-BL1-2604-001', cabang: 'BLOK M 1', total: 300, sesuai: 298, missing: 2, extra: 0, modal: 5460000, jual: 6440000, status: 'Selisih' },
    { id: 3, tanggal: '21/03/2026', kode: 'OPN-BL1-2605-001', cabang: 'BLOK M 1', total: 300, sesuai: 300, missing: 0, extra: 1, modal: 5460000, jual: 6440000, status: 'Selisih' },
    { id: 4, tanggal: '26/02/2026', kode: 'OPN-BL1-2605-001', cabang: 'BLOK M 1', total: 290, sesuai: 290, missing: 0, extra: 0, modal: 5460000, jual: 6440000, status: 'Sesuai' },
    { id: 5, tanggal: '01/01/2026', kode: 'OPN-BL1-2605-001', cabang: 'BLOK M 1', total: 290, sesuai: 290, missing: 0, extra: 0, modal: 5460000, jual: 6440000, status: 'Sesuai' },
    { id: 6, tanggal: '11/12/2025', kode: 'OPN-BL1-2605-001', cabang: 'BLOK M 1', total: 280, sesuai: 280, missing: 0, extra: 0, modal: 5460000, jual: 6440000, status: 'Sesuai' },
    { id: 7, tanggal: '11/11/2025', kode: 'OPN-BL1-2605-001', cabang: 'BLOK M 1', total: 280, sesuai: 280, missing: 0, extra: 0, modal: 5460000, jual: 6440000, status: 'Sesuai' },
];

const Main = ({ setCurentState }) => {
    const [filterData, setFilterData] = useState({ search: '', status: '', cabang: '' });

    const [paramFetch, setParamFetch] = useState({
        data: DUMMY_DATA,
        page: 1,
        pageSize: 10,
        total: 15,
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
        setParamFetch(prev => ({ ...prev, page: 1 }));
    };

    const filterFields = [
        { name: 'search', type: 'text', placeholder: 'Cari tanggal/kode sesi...', deskSpan: 2 },
        {
            name: 'status', type: 'dropdown', placeholder: 'Pilih status', deskSpan: 1,
            options: [
                { label: 'Sesuai', value: 'SESUAI' },
                { label: 'Selisih', value: 'SELISIH' },
            ],
        },
        {
            name: 'cabang', type: 'dropdown', placeholder: 'Pilih cabang', deskSpan: 1,
            options: [
                { label: 'BLOK M 1', value: '1' },
            ],
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
        { header: 'Modal', accessor: 'modal', sortable: true, render: (row) => HelperFunctions.formatCurrency(row.modal) },
        { header: 'Jual', accessor: 'jual', sortable: true, render: (row) => HelperFunctions.formatCurrency(row.jual) },
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
                        onClick={() => setCurentState('detail')}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={16} weight="bold" />
                    </button>
                    {row.id === 1 && (
                        <button
                            onClick={() => setCurentState('form')}
                            className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                            title="Lanjutkan Sesi"
                        >
                            <PencilSimpleIcon size={16} weight="bold" />
                        </button>
                    )}
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
                onClick={() => setCurentState('form')}
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
                onPageChange={(page) => setParamFetch(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setParamFetch(prev => ({ ...prev, pageSize, page: 1 }))}
            />
        </div>
    );
};

export default Main;
