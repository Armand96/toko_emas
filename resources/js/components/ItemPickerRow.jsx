import { ScanIcon } from "@phosphor-icons/react";
import Dropdown from "./FormElement/SingleElement/Dropdown";

const ItemPickerRow = ({
    onScan,
    // dropdown variant
    options = [],
    onSelect,
    error,
    // input variant
    variant = "dropdown", // "dropdown" | "input"
    value = "",
    onChange,
    onSubmit,
    submitLabel = "Verifikasi Barang",
    submitDisabled = false,
    placeholder = "Pilih item..",
    className = "",
}) => {
    const isInput = variant === "input";

    return (
        <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 ${className}`}
        >
            <button
                type="button"
                onClick={onScan}
                className="flex flex-1 items-center justify-center gap-2 py-2.5 border border-primary-500 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors cursor-pointer"
            >
                <ScanIcon size={20} />
                Scan QR Code
            </button>

            <span className="text-gray-400 text-sm text-center">atau</span>

            {isInput ? (
                <>
                    <input
                        type="text"
                        value={value}
                        onChange={onChange}
                        onKeyDown={(e) => { if (e.key === "Enter") onSubmit?.(); }}
                        placeholder={placeholder}
                        className="flex-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitDisabled}
                        className="btn-primary px-6 py-2.5 rounded-lg font-medium text-sm"
                    >
                        {submitLabel}
                    </button>
                </>
            ) : (
                <div className="flex-1">
                    <Dropdown
                        name="item_select"
                        value={value}
                        options={options}
                        placeholder={placeholder}
                        onChange={onSelect}
                        error={error}
                    />
                </div>
            )}
        </div>
    );
};

export default ItemPickerRow;
