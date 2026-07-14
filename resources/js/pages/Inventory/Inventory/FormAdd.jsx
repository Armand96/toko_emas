import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CaretLeftIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import GenerateQR from "../../../components/Utils/GenerateQR";

import HeaderSection from "../../../components/HeaderSection";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";
import Input from "../../../components/FormElement/SingleElement/Input";
import CurrencyInput from "../../../components/FormElement/SingleElement/CurrencyInput";

import { showAlert } from "../../../utils/showAlert";
import HelperFunctions from "../../../utils/HelperFunctions";
import LoadingStore from "../../../Store/LoadingStore";

import InventoryApis from "../../../Services/Inventory.apis";
import OptionsStore from "../../../Store/OptionsStore";

const emptyItem = {
    branch_id: null,
    product_id: null,
    category_id: null,
    subcategory_id: null,
    berat: "",
    karat: "",
    no_seri: "",
    modal: "",
    jual: "",
    note: "",
    _produk_label: "",
    _produk_barcode: "",
};

const requiredItem = [
    ["branch_id", "Cabang wajib dipilih"],
    ["product_id", "Produk wajib dipilih"],
    ["berat", "Berat wajib diisi"],
    ["karat", "Karat wajib diisi"],
    ["modal", "Harga modal wajib diisi"],
];

const FormAddInventory = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [item, setItem] = useState(emptyItem);
    const [errors, setErrors] = useState({});

    const [allProducts, setAllProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([ensureProducts(), ensureBranches()])
            .then(([productData, branchData]) => {
                setAllProducts(productData || []);
                setBranchOptions(HelperFunctions.formatDropdown(branchData, "id", "branch_name"));
            })
            .catch((error) => console.error(error))
            .finally(() => setLoading(false));
    }, []);

    const selectBranch = (branchId) => {
        setSelectedBranch(branchId);

        const filtered = (allProducts || []).filter((p) => {
            if (p.branches && Array.isArray(p.branches)) {
                return p.branches.some((b) => String(b.branch_id) === String(branchId));
            }
            return String(p.branch_id) === String(branchId);
        });
        setProductOptions(filtered.map((p) => {
            const categoryName = p.category?.parent?.category_name || p.category?.category_name || "";
            const subcategoryName = p.subcategory?.category_name || "";
            const detail = [categoryName, subcategoryName].filter(Boolean).join(" · ");
            return {
                value: p.id,
                label: detail ? `${p.product_name} · ${detail}` : p.product_name,
                details: p,
            };
        }));

        setItem({ ...emptyItem, branch_id: branchId });
        setErrors({});
    };

    const handleBranchChange = (e) => {
        selectBranch(e.target.value);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "berat" || name === "karat") {
            const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
            setItem((prev) => ({ ...prev, [name]: normalized }));
            if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
            return;
        }

        if (name === "modal" || name === "jual") {
            setItem((prev) => ({ ...prev, [name]: value }));
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
                _produk_barcode: d.barcode ?? "",
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

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!validateItem()) return;

        const payload = {
            branch_id: Number(item.branch_id),
            product_id: Number(item.product_id),
            category_id: Number(item.category_id),
            subcategory_id: item.subcategory_id ? Number(item.subcategory_id) : null,
            berat: Number(item.berat),
            karat: Number(item.karat),
            modal: Number(item.modal),
            jual: item.jual ? Number(item.jual) : 0,
            note: item.note || null,
            serial_number: item.no_seri || null,
        };

        setLoading(true);
        setIsSubmitting(true);
        try {
            await InventoryApis.PostInventory(payload);
            showAlert({ icon: "success", isAutoClose: true, title: "Berhasil", message: "Item inventory berhasil ditambahkan." });
            navigate("/inventory/inventory");
        } catch (error) {
            console.error(error);
            showAlert({ icon: "error", title: "Gagal", message: "Terjadi kesalahan saat menyimpan item inventory." });
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <button
                onClick={() => navigate("/inventory/inventory")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 w-fit cursor-pointer"
            >
                <CaretLeftIcon size={18} /> Kembali
            </button>

            <HeaderSection
                title="Tambah Item Inventory"
                description="Tambahkan item inventory secara langsung tanpa melalui proses pembelian."
            />

            <div className="w-full max-w-xl p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex flex-col gap-4">
                    <Dropdown
                        label="Cabang"
                        name="branch_id"
                        value={selectedBranch}
                        options={branchOptions}
                        placeholder="Pilih cabang"
                        isRequired
                        error={errors.branch_id}
                        onChange={handleBranchChange}
                    />

                    <Dropdown
                        label="Produk (master)"
                        name="product_id"
                        value={item.product_id}
                        options={productOptions}
                        placeholder={selectedBranch ? "Pilih produk" : "Pilih cabang dulu"}
                        isRequired
                        isDisable={!selectedBranch}
                        error={errors.product_id}
                        onChange={handleChange}
                    />

                    {item._produk_barcode && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <GenerateQR value={item._produk_barcode} size={40} showText={false} />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Kode Produk</span>
                                <span className="text-sm font-medium text-gray-900">{item._produk_barcode}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Berat (g)"
                            name="berat"
                            type="text"
                            inputMode="decimal"
                            value={item.berat}
                            placeholder="0.00"
                            isRequired
                            error={errors.berat}
                            onChange={handleChange}
                        />
                        <Input
                            label="Karat"
                            name="karat"
                            type="text"
                            inputMode="numeric"
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
                        <CurrencyInput
                            label="Harga Modal"
                            name="modal"
                            value={item.modal}
                            placeholder="0"
                            isRequired
                            error={errors.modal}
                            onChange={handleChange}
                        />
                        <CurrencyInput
                            label="Harga Jual (Opsional)"
                            name="jual"
                            value={item.jual}
                            placeholder="0"
                            error={errors.jual}
                            onChange={handleChange}
                        />
                    </div>

                    <Input
                        label="Keterangan (Opsional)"
                        name="note"
                        type="text"
                        value={item.note}
                        placeholder="Catatan tambahan"
                        onChange={handleChange}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-primary mt-2 py-2 w-full rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FloppyDiskIcon size={20} /> {isSubmitting ? "Menyimpan..." : "Simpan Item Inventory"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormAddInventory;
