import React, { useState, useRef, useEffect } from "react";
import ModalCustom from "./modalCustom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

const ModalScanBarcode = ({ isOpen, onClose, onScanSuccess }) => {
    const [manualInput, setManualInput] = useState("");
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const streamRef = useRef(null); // simpan stream kamera

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            return;
        }

        const timeout = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            clearTimeout(timeout);
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async () => {
        try {
            setError(null);

            if (!videoRef.current) {
                setError("Video element belum siap.");
                return;
            }

            readerRef.current = new BrowserMultiFormatReader();

            const devices = await BrowserMultiFormatReader.listVideoInputDevices();

            if (!devices || devices.length === 0) {
                setError("Tidak ada kamera ditemukan.");
                return;
            }

            const backCamera =
                devices.find((d) =>
                    /back|belakang|environment|rear/i.test(d.label)
                ) || devices[devices.length - 1];

            const controls = await readerRef.current.decodeFromVideoDevice(
                backCamera.deviceId,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        console.log("testttt", result.getText())
                        onScanSuccess(result.getText());
                        stopScanner();
                        onClose();
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        console.error("Scan error:", err);
                    }
                }
            );

            // Simpan stream dari video element setelah scanner jalan
            if (videoRef.current?.srcObject) {
                streamRef.current = videoRef.current.srcObject;
            }

        } catch (e) {
            console.error(e);
            setError("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
        }
    };

    const stopScanner = () => {
        // 1. Stop semua track dari stream — ini yang matikan lampu kamera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // 2. Reset reader zxing
        if (readerRef.current) {
            try {
                readerRef.current.reset();
            } catch (_) {}
            readerRef.current = null;
        }

        // 3. Bersihkan srcObject dari video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            onScanSuccess(manualInput.trim());
            setManualInput("");
            onClose();
        }
    };

    return (
        <ModalCustom
            title="Scan QR Code"
            isOpen={isOpen}
            onClose={onClose}
            footer={false}
        >
            <div className="flex flex-col items-center justify-center p-6 min-h-[300px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">

                <div className="w-full max-w-sm mb-4 rounded-lg overflow-hidden bg-black flex justify-center relative">
                    <video
                        ref={videoRef}
                        className="w-full object-cover aspect-square"
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center mb-2">{error}</p>
                )}

                <p className="text-gray-500 font-medium text-center mt-2">
                    Arahkan QR Code ke kamera. <br />
                    <span className="text-sm font-normal text-gray-400">
                        Pastikan pencahayaan cukup dan kamera fokus.
                    </span>
                </p>
            </div>
        </ModalCustom>
    );
};

export default ModalScanBarcode;
