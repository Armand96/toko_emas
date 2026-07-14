import { useEffect, useState } from "react";
import ModalCustom from "../../../components/modalCustom";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";
import Input from "../../../components/FormElement/SingleElement/Input";
import CurrencyInput from "../../../components/FormElement/SingleElement/CurrencyInput";
import PhotoInput from "../../../components/FormElement/SingleElement/PhotoInput";

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
    foto: null,
};

const requiredItem = [
    ["branch_id", "Cabang wajib dipilih"],
    ["product_id", "Produk wajib dipilih"],
    ["berat", "Berat wajib diisi"],
    ["karat", "Karat wajib diisi"],
    ["modal", "Harga modal wajib diisi"],
];

const AddItemModal = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);

    const [item, setItem] = useState(emptyItem);
    const [errors, setErrors] = useState({});

    const [allProducts, setAllProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);

    useEffect(() => {
        if (!isOpen) return;
        setItem(emptyItem);
        setErrors({});
        setProductOptions([]);

        setLoading(true);
        Promise.all([ensureProducts(), ensureBranches()])
            .then(([productData, branchData]) => {
                setAllProducts(productData || []);
                setBranchOptions(HelperFunctions.formatDropdown(branchData, "id", "branch_name"));
            })
            .catch((error) => console.error(error))
            .finally(() => setLoading(false));
    }, [isOpen]);

    const selectBranch = (branchId) => {
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

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "branch_id") {
            selectBranch(value);
            return;
        }

        if (name === "foto") {
            const file = files ? files[0] : value;
            setItem((prev) => ({ ...prev, foto: file ?? null }));
            return;
        }

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
            const res = await InventoryApis.PostInventory(payload);
            const created = res?.data?.data || res?.data;

            if (item.foto && created?.id) {
                const formData = new FormData();
                formData.append("inventory_ids", String(created.id));
                formData.append("images[]", item.foto);
                await InventoryApis.PostInventoryImage(formData);
            }

            showAlert({ icon: "success", isAutoClose: true, title: "Berhasil", message: "Item inventory berhasil ditambahkan." });
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            showAlert({ icon: "error", title: "Gagal", message: "Terjadi kesalahan saat menyimpan item inventory." });
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <ModalCustom
            isOpen={isOpen}
            onClose={onClose}
            title="Tambah Item Inventory"
            size="md"
            confirmTextButton={isSubmitting ? "Menyimpan..." : "Simpan"}
            cancelTextButton="Batal"
            handleOnSubmit={handleSubmit}
            disabledBtn={isSubmitting}
        >
            <div className="flex flex-col gap-3">
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
                    label="Produk (master)"
                    name="product_id"
                    value={item.product_id}
                    options={productOptions}
                    placeholder={item.branch_id ? "Pilih produk" : "Pilih cabang dulu"}
                    isRequired
                    isDisable={!item.branch_id}
                    error={errors.product_id}
                    onChange={handleChange}
                />

                <PhotoInput
                    label="Foto Item (Opsional)"
                    name="foto"
                    value={item.foto}
                    helperText="Foto berformat JPG, JPEG, PNG, atau GIF. Maksimal 3 MB."
                    onChange={handleChange}
                />

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
            </div>
        </ModalCustom>
    );
};

export default AddItemModal;
