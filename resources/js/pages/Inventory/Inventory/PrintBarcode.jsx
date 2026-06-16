import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PrinterIcon } from "@phosphor-icons/react";

const QR_PX = 320; // resolusi render QR (kotak)

const PrintBarcode = () => {
    const [items, setItems] = useState([]);
    const [images, setImages] = useState({}); // index -> dataURL PNG
    const canvasRefs = useRef({});

    useEffect(() => {
        const raw = sessionStorage.getItem("print_barcode_data");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            const barcodes = parsed?.barcodes || [];
            const extra = parsed?.extra || {};

            setItems(
                barcodes.map((code) => ({
                    barcode: code,
                    label: extra.label || extra.produk || "",
                }))
            );
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        if (items.length === 0) return;
        const id = setTimeout(() => {
            const next = {};
            items.forEach((_, index) => {
                const canvas = canvasRefs.current[index];
                if (canvas) next[index] = canvas.toDataURL("image/png");
            });
            setImages(next);
        }, 100);
        return () => clearTimeout(id);
    }, [items]);

    return (
        <div className="qr-print-page">
            <style>{`
                /* ====== Layar ====== */
                .qr-print-page {
                    min-height: 100vh;
                    background: #f3f4f6;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .qr-toolbar {
                    width: 100%;
                    max-width: 360px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .qr-list {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                /* Label horizontal: QR kiri, teks kanan */
                .qr-label {
                    width: 58mm;
                    box-sizing: border-box;
                    background: #fff;
                    padding: 2mm;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 2mm;
                    border: 1px solid #e5e7eb;
                }
                .qr-img {
                    width: 12mm;
                    height: 12mm;
                    aspect-ratio: 1 / 1;
                    object-fit: contain;
                    display: block;
                    flex-shrink: 0;
                    image-rendering: pixelated;
                }
                .qr-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5mm;
                    min-width: 0;
                }
                .qr-code {
                    font-size: 9pt;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    color: #111827;
                    line-height: 1.15;
                    word-break: break-word;
                }
                .qr-name {
                    font-size: 8pt;
                    color: #374151;
                    line-height: 1.15;
                    word-break: break-word;
                }
                .qr-source { position: absolute; left: -99999px; top: 0; }

                /* ====== Cetak ====== */
                @media print {
                    @page { size: 58mm auto; margin: 0; }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 58mm;
                        background: #fff !important;
                    }
                    .qr-print-page {
                        min-height: 0;
                        background: #fff;
                        padding: 0;
                        gap: 0;
                        display: block;
                    }
                    .no-print { display: none !important; }
                    .qr-list { display: block; }
                    .qr-label {
                        width: 58mm;
                        border: none;
                        padding: 2mm 1mm;
                        page-break-after: always;
                        break-after: page;
                    }
                    .qr-label:last-child {
                        page-break-after: auto;
                        break-after: auto;
                    }
                    .qr-img {
                        width: 12mm;
                        height: 12mm;
                        aspect-ratio: 1 / 1;
                        object-fit: contain;
                    }
                }
            `}</style>

            <div className="qr-toolbar no-print">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Cetak QR Code</h1>
                    <p className="text-sm text-gray-500">
                        {items.length} label siap dicetak (thermal 58mm)
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn-primary py-2 px-4 rounded-lg flex items-center gap-2"
                >
                    <PrinterIcon size={20} /> Cetak
                </button>
            </div>

            {/* canvas tersembunyi: sumber render QR -> PNG */}
            <div className="qr-source" aria-hidden="true">
                {items.map((item, index) => (
                    <QRCodeCanvas
                        key={index}
                        value={item.barcode}
                        size={QR_PX}
                        level="M"
                        marginSize={2}
                        ref={(el) => (canvasRefs.current[index] = el)}
                    />
                ))}
            </div>

            <div className="qr-list">
                {items.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8 no-print">
                        Tidak ada data untuk dicetak.
                    </p>
                )}
                {items.map((item, index) => (
                    <div key={index} className="qr-label">
                        {images[index] && (
                            <img src={images[index]} alt={item.barcode} className="qr-img" />
                        )}
                        <div className="qr-text">
                            <span className="qr-code">{item.barcode}</span>
                            {item.label && <span className="qr-name">{item.label}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrintBarcode;
