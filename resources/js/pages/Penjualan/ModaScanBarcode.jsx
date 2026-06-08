import React, { useState, useRef, useEffect } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";
import ModalCustom from "../../components/modalCustom";

const ModalScanBarcode = ({ isOpen, onClose, onScanSuccess }) => {
    const [manualInput, setManualInput] = useState("");
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const readerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            // Stop scanner saat modal ditutup
            stopScanner();
            return;
        }

        startScanner();

        return () => stopScanner();
    }, [isOpen]);

    const startScanner = async () => {
        try {
            setError(null);
            readerRef.current = new BrowserMultiFormatReader();

            // Ambil daftar kamera, prioritaskan kamera belakang
            const devices = await BrowserMultiFormatReader.listVideoInputDevices();
            const backCamera = devices.find(d =>
                d.label.toLowerCase().includes("back") ||
                d.label.toLowerCase().includes("belakang") ||
                d.label.toLowerCase().includes("environment")
            ) || devices[devices.length - 1]; // fallback ke kamera terakhir (biasanya belakang)

            if (!backCamera) {
                setError("Tidak ada kamera ditemukan.");
                return;
            }

            await readerRef.current.decodeFromVideoDevice(
                backCamera.deviceId,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        onScanSuccess(result.getText());
                        stopScanner();
                    }
                    // Abaikan NotFoundException — itu normal (frame tanpa barcode)
                    if (err && !(err instanceof NotFoundException)) {
                        console.error("Scan error:", err);
                    }
                }
            );
        } catch (e) {
            console.error(e);
            setError("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
        }
    };

    const stopScanner = () => {
        if (readerRef.current) {
            readerRef.current.reset();
            readerRef.current = null;
        }
    };

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            onScanSuccess(manualInput.trim());
            setManualInput("");
        }
    };

    return (
        <ModalCustom
            title="Scan Barcode Code 128"
            isOpen={isOpen}
            onClose={onClose}
            footer={false}
        >
            <div className="flex flex-col items-center justify-center p-6 min-h-[300px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">

                <div className="w-full max-w-sm mb-4 rounded-lg overflow-hidden bg-black flex justify-center relative">
                    <video
                        ref={videoRef}
                        className="w-full object-cover aspect-video"
                    />
                    {/* Garis scan animasi */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse -translate-y-1/2" />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center mb-2">{error}</p>
                )}

                <p className="text-gray-500 font-medium text-center mt-2">
                    Arahkan barcode (Code 128) ke kamera. <br />
                    <span className="text-sm font-normal text-gray-400">
                        Pastikan pencahayaan cukup dan kamera fokus.
                    </span>
                </p>

                {/* Input Manual */}
                <div className="mt-6 flex gap-2 w-full max-w-sm">
                    <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                        placeholder="Atau ketik ID produk..."
                        className="flex-1 text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-primary-500 outline-none"
                    />
                    <button
                        onClick={handleManualSubmit}
                        className="bg-primary-500 text-white p-2 rounded-md hover:bg-primary-600 transition-colors"
                    >
                        <MagnifyingGlass size={20} />
                    </button>
                </div>
            </div>
        </ModalCustom>
    );
};

export default ModalScanBarcode;
