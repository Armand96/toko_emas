import { WarningCircleIcon, TrashIcon, FolderOpenIcon, CameraIcon } from "@phosphor-icons/react";
import { useRef, useState, useEffect } from "react";
import Drawer from "../../Drawer";
import compressImage from "../../../utils/compressImage";

const PhotoInput = ({
    label,
    name,
    onChange,
    error,
    isRequired,
    isDisable,
    helperText,
    value,
    accept = "image/*"
}) => {
    const inputRef = useRef(null);
    const cameraRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

    // Kamera hanya relevan di perangkat touch (mobile/tablet). Di desktop,
    // "Dari Kamera" cuma jatuh ke dialog file yang sama dengan "Dari File",
    // jadi drawer tidak perlu ditampilkan.
    const hasCamera =
        typeof window !== "undefined" &&
        (("ontouchstart" in window) || navigator.maxTouchPoints > 0);

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

    const handleChange = async (e) => {
        const file = e.target.files?.[0];
        setIsDrawerOpen(false);
        if (!file) return;

        let finalFile = file;
        if (file.type?.startsWith("image/")) {
            setIsCompressing(true);
            try {
                finalFile = await compressImage(file, { maxSizeMB: 3 });
            } catch {
                finalFile = file;
            } finally {
                setIsCompressing(false);
            }
        }

        // Kirim event sintetis dengan file yang sudah dikompres.
        onChange({ target: { name, value: finalFile, files: [finalFile] } });
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: null, files: null } });
        if (inputRef.current) inputRef.current.value = '';
        if (cameraRef.current) cameraRef.current.value = '';
    };

    const openPicker = () => {
        if (isDisable) return;
        // Desktop: langsung buka dialog file. Mobile: buka drawer pilihan sumber.
        if (hasCamera) setIsDrawerOpen(true);
        else inputRef.current?.click();
    };

    const pickFromFile = () => inputRef.current?.click();
    const pickFromCamera = () => cameraRef.current?.click();

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

                    {/* Input file (galeri / file system) */}
                    <input
                        ref={inputRef}
                        type="file"
                        name={name}
                        onChange={handleChange}
                        disabled={isDisable}
                        className="hidden"
                        accept={accept}
                    />
                    {/* Input kamera langsung (hanya di perangkat touch) */}
                    {hasCamera && (
                        <input
                            ref={cameraRef}
                            type="file"
                            name={name}
                            onChange={handleChange}
                            disabled={isDisable}
                            className="hidden"
                            accept={accept}
                            capture="environment"
                        />
                    )}

                    <button
                        type="button"
                        disabled={isDisable || isCompressing}
                        onClick={openPicker}
                        className="w-fit px-5 py-1.5 text-sm font-medium text-primary-600 border border-primary-400 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCompressing ? "Memproses..." : value ? "Ganti Foto" : "Upload"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-1.5 mt-1 text-danger-500">
                    <WarningCircleIcon size={16} />
                    <span className="text-xs">{error}</span>
                </div>
            )}

            {hasCamera && (
            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Pilih Sumber Foto"
            >
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={pickFromFile}
                        className="flex flex-col items-center justify-center gap-2 p-5 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                            <FolderOpenIcon size={26} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">Dari File</span>
                    </button>

                    <button
                        type="button"
                        onClick={pickFromCamera}
                        className="flex flex-col items-center justify-center gap-2 p-5 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                            <CameraIcon size={26} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">Dari Kamera</span>
                    </button>
                </div>
            </Drawer>
            )}
        </div>
    );
};

export default PhotoInput;
