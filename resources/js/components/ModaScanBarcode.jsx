import { useState, useRef, useEffect, useCallback } from "react";
import ModalCustom from "./modalCustom";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ID = "qr-scanner-region";

const ModalScanBarcode = ({ isOpen, onClose, onScanSuccess }) => {
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const scanningRef = useRef(false);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current && scanningRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (_) {}
            scanningRef.current = false;
        }
        if (scannerRef.current) {
            try {
                scannerRef.current.clear();
            } catch (_) {}
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(async () => {
        try {
            setError(null);

            const el = document.getElementById(SCANNER_ID);
            if (!el) return;

            const scanner = new Html5Qrcode(SCANNER_ID);
            scannerRef.current = scanner;

            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                setError("Tidak ada kamera ditemukan.");
                return;
            }

            const backCamera = devices.find((d) =>
                /back|belakang|environment|rear/i.test(d.label)
            ) || devices[devices.length - 1];

            await scanner.start(
                backCamera.id,
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    onScanSuccess(decodedText);
                    stopScanner();
                    onClose();
                },
                () => {}
            );

            scanningRef.current = true;
        } catch (e) {
            console.error(e);
            setError("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
        }
    }, [onScanSuccess, onClose, stopScanner]);

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

    return (
        <ModalCustom
            title="Scan QR Code"
            isOpen={isOpen}
            onClose={() => {
                stopScanner();
                onClose();
            }}
            footer={false}
        >
            <div className="flex flex-col items-center justify-center p-4 min-h-[300px]">
                <div className="w-full max-w-sm rounded-lg overflow-hidden bg-black relative">
                    <div id={SCANNER_ID} className="w-full" />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center mt-3">{error}</p>
                )}

                <p className="text-gray-500 font-medium text-center mt-3 text-sm">
                    Arahkan QR Code ke kamera. <br />
                    <span className="text-xs font-normal text-gray-400">
                        Pastikan pencahayaan cukup dan kamera fokus.
                    </span>
                </p>
            </div>
        </ModalCustom>
    );
};

export default ModalScanBarcode;
