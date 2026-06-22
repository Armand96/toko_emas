import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { PlusCircleIcon, EyeIcon, PencilSimpleLineIcon, TrashIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import Table from "../../components/Table/Table";
import InputGroup from "../../components/FormElement/InputGroup";
import HelperFunctions from "../../utils/HelperFunctions";
import { showAlert } from "../../utils/showAlert";
import LoadingStore from "../../Store/LoadingStore";
import ModalTransaksi from "./Modal";
import FinanceApis from "../../Services/Finance.apis";
import OptionsStore from "../../Store/OptionsStore";
import PermissionStore from "../../Store/PermissionStore";

const TIPE_OPTIONS = [
    { value: 'CASH IN', label: 'Cash In' },
    { value: 'CASH OUT', label: 'Cash Out' },
];

const Finance = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((s) => s.can);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const [filter, setFilter] = useState({ search: '', tipe: '', cabang: '' });
    const [filterBounce] = useDebounce(filter, 500);
    const [firstLoading, setFirstLoading] = useState(false);

    const [branchOptions, setBranchOptions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
    const [selectedData, setSelectedData] = useState(null);

    const [paramFetch, setParamFetch] = useState({
        data: [],
        current_page: 1,
        total: 0,
        per_page: 10,
    });

    const fetchData = async (page = 1, pageSize = 10, params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                per_page: pageSize,
            });
            if (params.search) query.append('note', params.search);
            if (params.tipe) query.append('type', params.tipe);
            if (params.cabang) query.append('branch_id', params.cabang);

            const res = await FinanceApis.GetFinance(`?${query.toString()}`);
            setParamFetch(res);
            setFirstLoading(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        ensureBranches()
            .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, "id", "branch_name")))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (firstLoading) {
            fetchData(1, paramFetch.per_page, filterBounce);
        }
    }, [filterBounce]);

    const handleOpenAdd = () => {
        setModalMode('add');
        setSelectedData(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (row) => {
        setModalMode('edit');
        setSelectedData(row);
        setIsModalOpen(true);
    };

    const handleOpenView = (row) => {
        setModalMode('view');
        setSelectedData(row);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedData(null), 300);
    };

    const handleDelete = async (row) => {
        const { confirmed } = await showAlert({
            title: 'Hapus Transaksi',
            message: 'Apakah Anda yakin ingin menghapus transaksi ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            await FinanceApis.DeleteFinance(row.id);
            fetchData(paramFetch.current_page, paramFetch.per_page, filterBounce);
            showAlert({ icon: 'success', isAutoClose: true, title: 'Berhasil', message: 'Data transaksi berhasil dihapus' });
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal menghapus data transaksi' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (form) => {
        setLoading(true);
        try {
            const body = new FormData();
            body.append('branch_id', form.branch_id);
            body.append('category_finance_id', form.category_finance_id);
            body.append('bank_cabang_id', form.payment_method === 'TRANSFER' ? form.bank_cabang_id : 0);
            body.append('type', form.type);
            body.append('payment_method', form.payment_method);
            body.append('nominal', form.nominal);
            body.append('note', form.note || '');
            if (form.attachment instanceof File) {
                body.append('attachment', form.attachment);
            }

            await (form?.id ? FinanceApis.PutFinance(form.id, body) : FinanceApis.PostFinance(body));

            handleCloseModal();
            fetchData(paramFetch.current_page, paramFetch.per_page, filterBounce);
            showAlert({ icon: 'success', isAutoClose: true, title: 'Berhasil', message: 'Data transaksi berhasil disimpan' });
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal menyimpan data transaksi' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Tanggal', accessor: 'created_at', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-' },
        { header: 'Cabang', accessor: 'branch', render: (row) => row.branch?.branch_name ?? '-' },
        {
            header: 'Tipe', accessor: 'type',
            render: (row) => (
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${row.type === 'CASH IN'
                    ? 'bg-success-50 text-success-700 border-success-200'
                    : 'bg-danger-50 text-danger-700 border-danger-200'}`}>
                    {row.type === 'CASH IN' ? 'Cash In' : 'Cash Out'}
                </span>
            )
        },
        { header: 'Kategori', accessor: 'category', render: (row) => row.category?.category_name ?? '-' },
        { header: 'Metode Bayar', accessor: 'payment_method', render: (row) => row.payment_method === 'CASH' ? 'Cash' : 'Transfer' },
        { header: 'Jumlah', accessor: 'nominal', render: (row) => HelperFunctions.formatCurrency(row.nominal || 0) },
        {
            header: 'Keterangan', accessor: 'note',
            render: (row) => <span className="block max-w-[160px] truncate text-gray-600">{row.note || '-'}</span>
        },
        {
            header: 'Aksi', accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenView(row)}
                        className="p-1.5 text-info-500 hover:bg-info-50 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail"
                    >
                        <EyeIcon size={18} />
                    </button>
                    {can('update', 'finance') && (
                        <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1.5 text-primary-500 hover:bg-primary-50 border border-primary-200 rounded-md transition-colors cursor-pointer"
                            title="Edit"
                        >
                            <PencilSimpleLineIcon size={18} />
                        </button>
                    )}
                    {can('delete', 'finance') && (
                        <button
                            onClick={() => handleDelete(row)}
                            className="p-1.5 text-danger-500 hover:bg-danger-50 border border-danger-200 rounded-md transition-colors cursor-pointer"
                            title="Hapus"
                        >
                            <TrashIcon size={18} />
                        </button>
                    )}
                </div>
            )
        },
    ];

    const onChangePage = (page) => fetchData(page, paramFetch.per_page, filterBounce);
    const onChangePageSize = (pageSize) => fetchData(1, pageSize, filterBounce);

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Finance"
                description="Kelola data keuangan toko."
                icon={PlusCircleIcon}
                textButton="Tambah Transaksi"
                onClick={can('create', 'finance') ? handleOpenAdd : undefined}
            />

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] max-w-xs">
                    <InputGroup
                        fields={[{
                            name: "search",
                            label: "",
                            type: "search",
                            placeholder: "Cari keterangan",
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
                <div className="w-[160px]">
                    <InputGroup
                        fields={[{
                            name: "tipe",
                            label: "",
                            type: "dropdown",
                            placeholder: "Semua tipe",
                            options: TIPE_OPTIONS,
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
                <div className="w-[170px]">
                    <InputGroup
                        fields={[{
                            name: "cabang",
                            label: "",
                            type: "dropdown",
                            placeholder: "Semua cabang",
                            options: branchOptions,
                        }]}
                        formData={filter}
                        cols="1"
                        onChange={(e) => setFilter({ ...filter, [e.target.name]: e.target.value })}
                    />
                </div>
            </div>

            <Table
                columns={columns}
                data={paramFetch.data}
                page={paramFetch.current_page}
                pageSize={paramFetch.per_page}
                total={paramFetch.total}
                onPageChange={onChangePage}
                onPageSizeChange={onChangePageSize}
            />

            <ModalTransaksi
                isOpen={isModalOpen}
                mode={modalMode}
                data={selectedData}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default Finance;
