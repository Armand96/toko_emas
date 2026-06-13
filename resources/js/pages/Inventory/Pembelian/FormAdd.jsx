import { useEffect, useState } from "react";
import {
    CaretLeftIcon,
    FloppyDiskIcon,
    PlusCircleIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import Barcode from "react-barcode";

import HeaderSection from "../../../components/HeaderSection";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";
import Input from "../../../components/FormElement/SingleElement/Input";
import PhotoInput from "../../../components/FormElement/SingleElement/PhotoInput";
import Table from "../../../components/Table/Table";

import { showAlert } from "../../../utils/showAlert";
import HelperFunctions from "../../../utils/HelperFunctions";
import { generateBarcode } from "../../../utils/barcode";
import LoadingStore from "../../../Store/LoadingStore";

import InventoryApis from "../../../Services/Inventory.apis";
import BranchApis from "../../../Services/Branch.apis";
import BankApis from "../../../Services/Bank.apis";

const emptyItem = {
    product_id: null,
    category_id: null,
    subcategory_id: null,
    branch_id: null,
    bank_id: null,
    berat: "",
    karat: "",
    no_seri: "",
    modal: "",
    jual: "",
    foto: null,
    _produk_label: "",
};

const requiredItem = [
    ["product_id", "Produk wajib dipilih"],
    ["berat", "Berat wajib diisi"],
    ["karat", "Karat wajib diisi"],
    ["modal", "Harga modal wajib diisi"],
    ["jual", "Harga jual wajib diisi"],
    ["branch_id", "Cabang wajib dipilih"],
    ["bank_id", "Bank keluar wajib dipilih"],
];

const FormPembelian = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);

    const [item, setItem] = useState(emptyItem);
    const [errors, setErrors] = useState({});
    const [batch, setBatch] = useState([]);

    const [productOptions, setProductOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [bankOptions, setBankOptions] = useState([{value: "1", label: "test"}]);

    const fetchOptions = async () => {
        try {
            const [products, branches,] = await Promise.all([
                InventoryApis.GetProducts(""),
                BranchApis.GetBranch(""),
            ]);

            setProductOptions(
                HelperFunctions.formatDropdown(products?.data || [], "id", "product_name")
            );
            setBranchOptions(
                HelperFunctions.formatDropdown(branches?.data || [], "id", "branch_name")
            );
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "foto") {
            const file = e.target.files ? e.target.files[0] : value;
            setItem((prev) => ({ ...prev, foto: file ?? null }));
            return;
        }

        if(name === "branch_id"){
            BankApis.GetBankBranch(`?branch_id=${value}`).then((res) => {
            setBankOptions(HelperFunctions.formatDropdownWithCode(res?.data || [], "id", "nama_pemilik", "nomor_rekening"));

            })
        }

        if (name === "modal" || name === "jual") {
            const raw = HelperFunctions.unformatNumberInput(value);
            setItem((prev) => ({ ...prev, [name]: raw }));
            if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
            return;
        }

        if (name === "product_id") {
            const found = productOptions.find((p) => p.value === value);
            const d = found?.details || {};
            setItem((prev) => ({
                ...prev,
                product_id: value,
                category_id: d.category_id ?? null,
                subcategory_id: d.subcategory_id ?? null,
                _produk_label: found?.label ?? "",
            }));
            setErrors((prev) => ({ ...prev, product_id: "" }));
            return;
        }

        setItem((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateItem = () => {
        const newErrors = {};
        requiredItem.forEach(([key, msg]) => {
            const v = item[key];
            if (v === null || v === undefined || v === "") newErrors[key] = msg;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddToBatch = () => {
        if (!validateItem()) return;

        const prefix = item._produk_label || "ITM";
        const barcode = generateBarcode(prefix, batch.length);

        setBatch((prev) => [
            ...prev,
            { ...item, barcode, _rowId: Date.now() + Math.random() },
        ]);

        setItem(emptyItem);
        setErrors({});
    };

    const handleRemove = (rowId) => {
        setBatch((prev) => prev.filter((b) => b._rowId !== rowId));
    };

    const handleSubmitBatch = async () => {
        if (batch.length === 0) {
            showAlert({
                title: "Perhatian",
                message: "Belum ada item di batch",
                type: "warning",
            });
            return;
        }

        const payload = {
            data: batch.map((b) => ({
                branch_id: Number(b.branch_id),
                product_id: Number(b.product_id),
                category_id: Number(b.category_id),
                subcategory_id: Number(b.subcategory_id),
                bank_id: Number(b.bank_id),
                barcode: b.barcode,
                berat: Number(b.berat),
                karat: Number(b.karat),
                modal: Number(b.modal),
                jual: Number(b.jual),
            })),
        };

        setLoading(true);
        try {
            await InventoryApis.PostPembelian(payload);
            showAlert({
                title: "Berhasil",
                message: "Pembelian berhasil disimpan",
                icon: "success",
            });
            setBatch([]);
            setItem(emptyItem);
            if (setCurentState) setCurentState("main");
        } catch (error) {
            console.error(error);
            showAlert({
                title: "Gagal",
                message: "Gagal menyimpan pembelian",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Barcode",
            accessor: "barcode",
            render: (row) => (
                <Barcode
                    value={row.barcode}
                    width={1}
                    height={32}
                    fontSize={10}
                    margin={0}
                />
            ),
        },
        {
            header: "Produk",
            accessor: "_produk_label",
            render: (row) => row._produk_label || "-",
        },
        { header: "Berat", accessor: "berat", render: (row) => `${row.berat} g` },
        { header: "Karat", accessor: "karat", render: (row) => `${row.karat}K` },
        {
            header: "No Seri",
            accessor: "no_seri",
            render: (row) => row.no_seri || "-",
        },
        {
            header: "Modal",
            accessor: "modal",
            render: (row) => HelperFunctions.formatCurrency(row.modal || 0),
        },
        {
            header: "Jual",
            accessor: "jual",
            render: (row) => HelperFunctions.formatCurrency(row.jual || 0),
        },
        {
            header: "Cabang",
            accessor: "branch_id",
            render: (row) =>
                branchOptions.find((b) => b.value === row.branch_id)?.label || "-",
        },
        {
            header: "Bank Keluar",
            accessor: "bank_id",
            render: (row) =>
                bankOptions.find((b) => b.value === row.bank_id)?.label || "-",
        },
        {
            header: "Aksi",
            accessor: "aksi",
            render: (row) => (
                <button
                    onClick={() => handleRemove(row._rowId)}
                    className="p-1.5 btn-danger-outline rounded-md cursor-pointer"
                >
                    <TrashIcon size={18} />
                </button>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4 w-full">
            {setCurentState && (
                <button
                    onClick={() => setCurentState("main")}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 w-fit cursor-pointer"
                >
                    <CaretLeftIcon size={18} /> Kembali
                </button>
            )}

            <HeaderSection
                title="Input Pembelian"
                description="Lengkapi informasi pembelian dan detail item inventory."
            />

            <div className="flex flex-col lg:flex-row gap-4">
                {/* ============ ITEM BARU ============ */}
                <div className="w-full lg:w-2/5 p-6 bg-white rounded-lg border border-gray-200 h-fit">
                    <p className="text-lg font-medium text-gray-900">Item Baru</p>
                    <p className="text-sm text-gray-500">
                        Isi detail, barcode auto-generated
                    </p>

                    <div className="flex flex-col gap-4 mt-6">
                        <Dropdown
                            label="Produk (master)"
                            name="product_id"
                            value={item.product_id}
                            options={productOptions}
                            placeholder="Pilih produk"
                            isRequired
                            error={errors.product_id}
                            onChange={handleChange}
                        />

                        <PhotoInput
                            label="Foto Item"
                            name="foto"
                            value={item.foto}
                            helperText="Foto berformat JPG, JPEG, atau PNG."
                            onChange={handleChange}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Berat (g)"
                                name="berat"
                                type="number"
                                value={item.berat}
                                placeholder="0.00"
                                isRequired
                                error={errors.berat}
                                onChange={handleChange}
                            />
                            <Input
                                label="Karat"
                                name="karat"
                                type="number"
                                value={item.karat}
                                placeholder="0"
                                isRequired
                                error={errors.karat}
                                onChange={handleChange}
                            />
                        </div>

                        <Input
                            label="No Seri (Opsional)"
                            name="no_seri"
                            type="text"
                            value={item.no_seri}
                            placeholder="Contoh: ABCD1234"
                            onChange={handleChange}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Harga Modal"
                                name="modal"
                                type="text"
                                value={HelperFunctions.formatNumberInput(item.modal)}
                                placeholder="Rp 0"
                                isRequired
                                error={errors.modal}
                                onChange={handleChange}
                            />
                            <Input
                                label="Harga Jual"
                                name="jual"
                                type="text"
                                value={HelperFunctions.formatNumberInput(item.jual)}
                                placeholder="Rp 0"
                                isRequired
                                error={errors.jual}
                                onChange={handleChange}
                            />
                        </div>

                        <Dropdown
                            label="Cabang"
                            name="branch_id"
                            value={item.branch_id}
                            options={branchOptions}
                            placeholder="Pilih cabang"
                            isRequired
                            error={errors.branch_id}
                            onChange={handleChange}
                        />

                        <Dropdown
                            label="Bank Keluar"
                            name="bank_id"
                            value={item.bank_id}
                            options={bankOptions}
                            placeholder="Pilih bank"
                            isRequired
                            error={errors.bank_id}
                            onChange={handleChange}
                        />

                        <button
                            onClick={handleAddToBatch}
                            className="btn-primary mt-2 py-2 w-full rounded-lg flex items-center justify-center gap-2"
                        >
                            <PlusCircleIcon size={20} /> Tambah ke Batch
                        </button>
                    </div>
                </div>

                {/* ============ BATCH PEMBELIAN ============ */}
                <div className="w-full lg:w-3/5 p-6 bg-white rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-col">
                            <p className="text-lg font-medium text-gray-900">
                                Batch Pembelian ({batch.length} item)
                            </p>
                            <p className="text-sm text-gray-500">
                                Periksa item sebelum disimpan
                            </p>
                        </div>
                        <button
                            onClick={handleSubmitBatch}
                            disabled={batch.length === 0}
                            className="btn-primary py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FloppyDiskIcon size={20} /> Simpan &amp; Ajukan Pembelian
                        </button>
                    </div>

                    <div className="mt-6">
                        <Table
                            columns={columns}
                            data={batch}
                            total={batch.length}
                            paginate={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormPembelian;
