import { WarningCircleIcon, Trash, TrashIcon } from "@phosphor-icons/react";
import { useRef, useState, useEffect } from "react";

const PhotoInput = ({
    label,
    name,
    onChange,
    error,
    isRequired,
    isDisable,
    helperText,
    value,
    accept
}) => {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    // Sinkronisasi preview jika value berubah (saat edit mode)
    useEffect(() => {
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof value === 'string') {
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

    const handleRemove = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: null, files: null } });
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label} {isRequired && <span className="text-danger-500">*</span>}
                </label>
            )}

            <div className="flex items-center gap-4 p-4 ">
                <div className="w-24 h-20 flex-shrink-0 border border-gray-200 bg-white overflow-hidden flex items-center justify-center relative group">
                    {preview ? (
                        <>
                            <img src={preview} alt="preview" className="w-[373px] h-full object-contain" />
                            {!isDisable && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <button type="button" onClick={handleRemove} className="text-white hover:text-danger-400">
                                        <TrashIcon size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-500 max-w-[300px]">{helperText}</span>
                    <input
                        ref={inputRef}
                        type="file"
                        name={name}
                        onChange={handleChange}
                        disabled={isDisable}
                        className="hidden"
                        accept={accept}
                        capture="environment"
                    />
                    <button
                        type="button"
                        disabled={isDisable}
                        onClick={() => !isDisable && inputRef.current?.click()}
                        className="w-fit px-5 py-1.5 text-sm font-medium text-primary-600 border border-primary-400 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {value ? "Ganti Foto" : "Upload"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-1.5 mt-1 text-danger-500">
                    <WarningCircleIcon size={16} />
                    <span className="text-xs">{error}</span>
                </div>
            )}
        </div>
    );
};

export default PhotoInput;
