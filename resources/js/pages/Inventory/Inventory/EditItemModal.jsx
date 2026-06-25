import { useState, useRef, useEffect } from "react";
import GenerateQR from "../../../components/Utils/GenerateQR";

import ModalCustom from "../../../components/modalCustom";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";
import Input from "../../../components/FormElement/SingleElement/Input";
import CurrencyInput from "../../../components/FormElement/SingleElement/CurrencyInput";

const PhotoUploadBox = ({ name, value, onChange }) => {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof value === "string") {
            setPreview(value);
        } else {
            setPreview(null);
        }
    }, [value]);

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onChange(e);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="w-full h-44 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                )}
            </div>
            <p className="text-xs text-gray-500">Foto berformat JPG, JPEG, atau PNG.</p>
            <input
                ref={inputRef}
                type="file"
                name={name}
                onChange={handleChange}
                className="hidden"
                accept="image/jpeg,image/jpg,image/png"
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-fit px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-400 rounded-lg hover:bg-primary-50 transition-colors"
            >
                {value ? "Ganti Foto" : "Upload"}
            </button>
        </div>
    );
};

const EditItemModal = ({ isOpen, onClose, formData, errors = {}, onChange, onSubmit, productOptions = [], branchOptions = [] }) => {
    if (!formData) return null;

    return (
        <ModalCustom
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Item Inventory"
            size="md"
            confirmTextButton="Simpan"
            cancelTextButton="Batal"
            handleOnSubmit={onSubmit}
        >
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-4 min-w-0">
                <div className="w-full sm:w-44 flex flex-col gap-2 flex-shrink-0 min-w-0">
                    <PhotoUploadBox name="foto" value={formData.foto} onChange={onChange} />
                    <div className="w-full border border-gray-200 rounded-lg p-3 overflow-hidden flex flex-col items-center gap-1">
                        <GenerateQR value={formData.inventory_code} size={56} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <Dropdown
                        label="Produk (master)"
                        name="product_id"
                        value={formData.product_id}
                        options={productOptions}
                        placeholder="Pilih produk"
                        isRequired
                        isDisable
                        error={errors.product_id}
                        onChange={onChange}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Berat (g)"
                            name="berat"
                            type="text"
                            inputMode="decimal"
                            value={formData.berat}
                            placeholder="0.00"
                            isRequired
                            error={errors.berat}
                            onChange={onChange}
                        />
                        <Input
                            label="Karat"
                            name="karat"
                            type="text"
                            inputMode="numeric"
                            value={formData.karat}
                            placeholder="0"
                            isRequired
                            error={errors.karat}
                            onChange={onChange}
                        />
                    </div>

                    <Input
                        label="No.Seri (opsional)"
                        name="no_seri"
                        type="text"
                        value={formData.no_seri}
                        placeholder="Contoh: ABCD1234"
                        onChange={onChange}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <CurrencyInput
                            label="Harga Modal"
                            name="modal"
                            value={formData.modal}
                            placeholder="0"
                            isDisable
                            onChange={onChange}
                        />
                        <CurrencyInput
                            label="Harga Jual"
                            name="jual"
                            value={formData.jual}
                            placeholder="0"
                            isRequired
                            error={errors.jual}
                            onChange={onChange}
                        />
                    </div>

                    <Dropdown
                        label="Cabang"
                        name="branch_id"
                        value={formData.branch_id}
                        options={branchOptions}
                        placeholder="Pilih cabang"
                        isDisable
                        error={errors.branch_id}
                        onChange={onChange}
                    />
                </div>
            </div>
        </ModalCustom>
    );
};

export default EditItemModal;
