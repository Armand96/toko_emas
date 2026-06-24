import { useState, useRef, useEffect } from "react";
import { PrinterIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import GenerateQR from "../../../components/Utils/GenerateQR";

import ModalCustom from "../../../components/modalCustom";
import SectionTitle from "../../../components/SectionTitle";
import Badge from "../../../components/Badge";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";
import Input from "../../../components/FormElement/SingleElement/Input";
import CurrencyInput from "../../../components/FormElement/SingleElement/CurrencyInput";

import HelperFunctions from "../../../utils/HelperFunctions";

const STATUS_TONE = {
    Available: "success",
    Transit:   "warning",
    Sold:      "gray",
    Repair:    "info",
    Lost:      "danger",
};

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


const RiwayatItem = ({ item }) => {
    const [open, setOpen] = useState(false);
    const hasDetail = item.changes && item.changes.length > 0;

    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="w-px flex-1 bg-gray-200" />
            </div>
            <div className="flex-1 pb-4">
                <button
                    type="button"
                    onClick={() => hasDetail && setOpen((p) => !p)}
                    className={`flex items-center gap-2 w-full text-left ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
                >
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">
                            {item.actor ? `${item.actor} · ` : ""}{item.date}
                        </p>
                        {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                    </div>
                    {hasDetail && (
                        open ? <CaretUpIcon size={16} className="text-gray-400" /> : <CaretDownIcon size={16} className="text-gray-400" />
                    )}
                </button>

                {hasDetail && open && (
                    <div className="mt-2 rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500 mb-2">
                            {item.changes.length} field diperbarui
                        </p>
                        <div className="flex flex-col gap-2">
                            {item.changes.map((change, idx) => (
                                <div key={idx}>
                                    <p className="text-xs text-gray-600 mb-1">{change.label}</p>
                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-danger-50 text-danger-500 line-through break-words">{change.from}</span>
                                        <span className="text-gray-400">{"→"}</span>
                                        <span className="px-2 py-0.5 rounded-md bg-success-50 text-success-600 break-words">{change.to}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const DetailItemModal = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    const margin = (item.jual || 0) - (item.modal || 0);
    const marginPct = item.modal ? ((margin / item.modal) * 100).toFixed(1) : 0;

    const handlePrintBarcode = () => {
        HelperFunctions.printBarcode(item.inventory_code, { label: item.produk });
    };

    return (
        <ModalCustom
            isOpen={isOpen}
            onClose={onClose}
            title="Detail Item Inventory"
            size="md"
            footer={false}
        >
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-4 min-w-0">
                {/* ============ KOLOM KIRI: Foto & Barcode ============ */}
                <div className="w-full sm:w-64 flex flex-col gap-2 flex-shrink-0 min-w-0">
                    <img
                        src={item.image}
                        alt={item.produk}
                        className="w-full h-64 rounded-lg object-cover bg-gray-100 border border-gray-200"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div className="w-full border border-gray-200 rounded-lg p-3 overflow-hidden flex flex-col items-center gap-1">
                        <GenerateQR value={item.inventory_code} size={64} />
                    </div>
                    <button
                        type="button"
                        onClick={handlePrintBarcode}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm btn-outline rounded-md cursor-pointer"
                    >
                        <PrinterIcon size={16} /> Cetak QR Code
                    </button>
                </div>

                {/* ============ KOLOM KANAN: Info & Riwayat ============ */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <div className="flex items-center justify-between">
                                <p className="text-base font-semibold text-gray-900">{item.produk}</p>
                                <Badge tone={STATUS_TONE[item.status] || "gray"}>{item.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                                {item.berat} {"·"} {item.karat} {item.no_seri ? `· ${item.no_seri}` : ""}
                            </p>

                            <div className="mt-2">
                                <p className="text-xs text-gray-500">Harga Jual</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {HelperFunctions.formatCurrency(item.jual)}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <div>
                                    <p className="text-xs text-gray-500">Harga Modal</p>
                                    <p className="text-sm text-gray-700">{HelperFunctions.formatCurrency(item.modal)}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">
                                    Margin keuntungan {"↗"} {HelperFunctions.formatCurrency(margin)} (+{marginPct}%)
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-sm border-t border-gray-100 pt-3">
                            <div className="flex">
                                <span className="w-28 flex-shrink-0 text-gray-500">Kategori</span>
                                <span className="text-gray-900">{item.kategori}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 flex-shrink-0 text-gray-500">Sub Kategori</span>
                                <span className="text-gray-900">{item.sub_kategori || "-"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 flex-shrink-0 text-gray-500">Cabang</span>
                                <span className="text-gray-900">{item.cabang}</span>
                            </div>
                            {item.keterangan && (
                                <p className="text-gray-900 mt-1">{item.keterangan}</p>
                            )}
                        </div>
                    </div>

                    {item.riwayat && item.riwayat.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                            <SectionTitle title="Riwayat" />
                            <div className="flex flex-col">
                                {item.riwayat.map((r, idx) => (
                                    <RiwayatItem key={idx} item={r} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalCustom>
    );
};

export const EditItemModal = ({ isOpen, onClose, formData, errors = {}, onChange, onSubmit, productOptions = [], branchOptions = [] }) => {
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
                {/* ============ KOLOM KIRI: Foto & Barcode ============ */}
                <div className="w-full sm:w-44 flex flex-col gap-2 flex-shrink-0 min-w-0">
                    <PhotoUploadBox name="foto" value={formData.foto} onChange={onChange} />
                    <div className="w-full border border-gray-200 rounded-lg p-3 overflow-hidden flex flex-col items-center gap-1">
                        <GenerateQR value={formData.inventory_code} size={56} />
                    </div>
                </div>

                {/* ============ KOLOM KANAN: Form Fields ============ */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <Dropdown
                        label="Produk (master)"
                        name="product_id"
                        value={formData.product_id}
                        options={productOptions}
                        placeholder="Pilih produk"
                        isRequired
                        error={errors.product_id}
                        onChange={onChange}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Berat (g)"
                            name="berat"
                            type="number"
                            value={formData.berat}
                            placeholder="0.00"
                            isRequired
                            error={errors.berat}
                            onChange={onChange}
                        />
                        <Input
                            label="Karat"
                            name="karat"
                            type="number"
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
                        error={errors.branch_id}
                        onChange={onChange}
                    />
                </div>
            </div>
        </ModalCustom>
    );
};
