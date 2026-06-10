import { useState } from 'react';
import { PlusCircle, Eye, X } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import Table from "../../../components/Table/Table";
import InputGroup from "../../../components/FormElement/InputGroup";
import ModalDetailTransfer from './ModalView';

const Main = ({ setCurentState }) => {
    const [filterData, setFilterData] = useState({ search: '', status: null });
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [paramFetch, setParamFetch] = useState({
        data: [
            { id: 1, tanggal: '10/10/2025', kode: 'TRF-2605016', item_produk: 'Cincin Flower 6gr 20K, Cincin Flower 2gr 20K, Ci...', cabang_asal: 'BLOK M 1', cabang_tujuan: 'BLOK M 2', status: 'Disetujui' },
            { id: 2, tanggal: '10/10/2025', kode: 'TRF-2605014', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 2', cabang_tujuan: 'BLOK M 1', status: 'Approval' },
            { id: 3, tanggal: '10/10/2025', kode: 'TRF-2605013', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 2', cabang_tujuan: 'BLOK M 1', status: 'Approval' },
            { id: 4, tanggal: '10/10/2025', kode: 'TRF-2605012', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 2', cabang_tujuan: 'BLOK M 1', status: 'Ditolak' },
            { id: 5, tanggal: '10/10/2025', kode: 'TRF-2605011', item_produk: 'Cincin Flower 5gr 20K', cabang_asal: 'BLOK M 2', cabang_tujuan: 'BLOK M 1', status: 'Dibatalkan' },
        ],
        page: 1,
        pageSize: 10,
        total: 15,
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const handleViewDetail = (row) => {
        setSelectedDetail({
            ...row,
            // field mapping agar sesuai ModalDetailTransfer
            kode_transaksi: row.kode,
            cabang_asal: row.cabang_asal,
            cabang_tujuan: row.cabang_tujuan,
            diajukan_oleh: 'Dianita Admin',
            pic_approval: 'Owner',
            tanggal_approval: '21 Mei 2026, 12:00',
            catatan: 'Pindah tempat',
            alasan: row.status === 'Ditolak'
                ? 'Karat tidak sesuai dengan dokumen pembelian. Mohon periksa kembali karat pada item.'
                : row.status === 'Dibatalkan'
                ? 'Salah input.'
                : null,
            items: [
                { kode: 'GLD0100000', image: null, nama: 'Kalung Italy Rantai', berat: '5g', karat: '18K', harga_jual: 19500000 },
                { kode: 'GLD0100000', image: null, nama: 'Gelang Flower', berat: '8g', karat: '20K', harga_jual: 19500000 },
            ],
        });
        setIsModalOpen(true);
    };

    const filterFields = [
        { name: 'search', type: 'text', placeholder: 'Cari produk...', deskSpan: 2 },
        {
            name: 'status', type: 'dropdown', placeholder: 'Pilih status', deskSpan: 1,
            options: [
                { label: 'Disetujui', value: 'Disetujui' },
                { label: 'Approval', value: 'Approval' },
                { label: 'Ditolak', value: 'Ditolak' },
                { label: 'Dibatalkan', value: 'Dibatalkan' },
            ],
        },
    ];

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal', sortable: true },
        { header: 'Kode', accessor: 'kode', sortable: true },
        { header: 'Item Produk', accessor: 'item_produk', sortable: true },
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
                    {row.status === 'Approval' && (
                        <button
                            onClick={() => handleViewDetail(row)}
                            className="p-1.5 text-danger-500 hover:bg-danger-50 border border-danger-200 rounded-md transition-colors cursor-pointer"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    )}
                    <button
                        onClick={() => handleViewDetail(row)}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
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
                onClick={() => setCurentState('form')}
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
                onPageChange={(page) => setParamFetch(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setParamFetch(prev => ({ ...prev, pageSize, page: 1 }))}
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
