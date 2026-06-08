import { useEffect, useState } from "react";
import { PlusCircleIcon, EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import InputGroup from "../../components/FormElement/InputGroup";
import Table from "../../components/Table/Table";
import LoadingStore from "../../Store/LoadingStore";
import FooterActionBar from "../../components/FooterActionBar";

const Main = ({ setCurentState }) => {
    const [paramFetch, setParamFetch] = useState({
        data: [{}],
        current_page: 1,
        total: 2,
        per_page: 10,
    });

    const setLoading = LoadingStore((state) => state.setLoading);
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectedData, setSelectedData] = useState(null);

    const [search, setSearch] = useState({
        search: '',
        status: null,
        kategori: null,
        cabang: null,
    });


        const handleSelectAll = (e) => {
            if (e.target.checked) {
                const allIds = paramFetch.data.map(item => item.id);
                setSelectedRows(allIds);
            } else {
                setSelectedRows([]);
            }
        };

        const handleSelectRow = (id) => {
            setSelectedRows(prev =>
                prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
            );
        };

        const handleBulkApprove = () => {
            showAlert('success', 'Berhasil', `${selectedRows.length} data pembelian berhasil disetujui`);
            setSelectedRows([]);
        };

        const handleBulkReject = () => {
            showAlert('success', 'Berhasil', `${selectedRows.length} data pembelian berhasil ditolak`);
            setSelectedRows([]);
        };


    const searchFields = [
        { name: 'search', label: 'Cari Produk', type: 'text' },
        { name: 'status', label: 'Pilih Status', type: 'dropdown', options: [] },
        { name: 'kategori', label: 'Pilih Kategori', type: 'dropdown', options: [] },
        { name: 'cabang', label: 'Pilih Cabang', type: 'dropdown', options: [] }
    ];

    const columns = [
          {
            header: (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === paramFetch.data.length && paramFetch.data.length > 0}
                />
            ),
            accessor: 'checkbox',
            render: (row) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                />
            )
        },
        { header: 'Tanggal', accessor: 'tanggal' },
        { header: 'Order ID', accessor: 'no_nota' },
        { header: 'Supplier', accessor: 'supplier' },
        { header: 'Cabang', accessor: 'cabang' },
        { header: 'Total Item', accessor: 'total_item' },
        { header: 'Total Harga', accessor: 'total_harga' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const isSelesai = row.status === 'Selesai';
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${isSelesai
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'bg-warning-50 text-warning-700 border-warning-200'
                        }`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        className="p-1.5 btn-outline text-info-500 hover:bg-info-50 rounded-md transition-colors"
                    >
                        <EyeIcon size={20} />
                    </button>
                    <button
                        className="p-1.5 btn-outline !border-primary-500 hover:bg-warning-50 rounded-md transition-colors"
                    >
                        <PencilSimpleLineIcon size={20} />
                    </button>
                </div>
            )
        }
    ];



    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Pembelian"
                description="Catat dan kelola pembelian barang sebelum masuk ke inventory aktif."
                icon={PlusCircleIcon}
                onClick={() => setCurentState('form')}
                textButton="Tambah Pembelian"
            />

            <div className="w-full xl:w-4/6">
                <InputGroup
                    fields={searchFields}
                    formData={search}
                    cols='4'
                    onChange={(e) => setSearch({ ...search, [e.target.name]: e.target.value })}
                />
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                total={paramFetch.total}
                currentPage={paramFetch.current_page}
                pageSize={paramFetch.per_page}
            />

            <div className="w-3/6 relative z-60">
                <FooterActionBar
                    selectedCount={selectedRows.length}
                    onClearSelection={() => setSelectedRows([])}
                    secondaryText="Tolak"
                    secondaryType="danger"
                    // secondaryIcon={<XIcon size={16} weight="bold" />}
                    onSecondaryClick={handleBulkReject}
                    primaryText="Setujui"
                    primaryType="primary"
                    // primaryIcon={<CheckIcon size={16} weight="bold" />}
                    onPrimaryClick={handleBulkApprove}
                />
            </div>

        </div>
    );
}

export default Main;
