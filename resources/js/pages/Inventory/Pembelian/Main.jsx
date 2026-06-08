import { useEffect, useState } from "react";
import { PlusCircleIcon, EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import InputGroup from "../../../components/FormElement/InputGroup";
import Table from "../../../components/Table/Table";
import LoadingStore from "../../../Store/LoadingStore";

const Main = ({ setCurentState }) => {
    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 2,
        per_page: 10,
    });

    const setLoading = LoadingStore((state) => state.setLoading);

    const [search, setSearch] = useState({
        search: '',
        status: null,
        kategori: null,
        cabang: null,
    });




    const searchFields = [
        { name: 'search', label: 'Cari Produk', type: 'text' },
        { name: 'status', label: 'Pilih Status', type: 'dropdown', options: [] },
        { name: 'kategori', label: 'Pilih Kategori', type: 'dropdown', options: [] },
        { name: 'cabang', label: 'Pilih Cabang', type: 'dropdown', options: [] }
    ];

    const columns = [
        { header: 'Tanggal', accessor: 'tanggal' },
        { header: 'No. Nota', accessor: 'no_nota' },
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

        </div>
    );
}

export default Main;
