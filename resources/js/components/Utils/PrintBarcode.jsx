import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PrinterIcon } from "@phosphor-icons/react";

const QR_PX = 320;

const PrintBarcode = () => {
    const [items, setItems] = useState([]);
    const [images, setImages] = useState({});
    const canvasRefs = useRef({});

    useEffect(() => {
        const raw = sessionStorage.getItem("print_barcode_data");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            const barcodes = parsed?.barcodes || [];
            const extra = parsed?.extra || {};
            const perItem = parsed?.items || extra?.items || null;

            setItems(
                barcodes.map((code, i) => ({
                    barcode: code,
                    label: perItem?.[i]?.label || extra.label || extra.produk || "",
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
                    gap: 0;
                }
                .qr-label {
                    width: 58mm;
                    box-sizing: border-box;
                    background: #fff;
                    padding: 1mm 1.5mm;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1.5mm;
                    border-bottom: none;
                }
                .qr-img {
                    width: 5mm;
                    height: 5mm;
                    aspect-ratio: 1 / 1;
                    object-fit: contain;
                    display: block;
                    flex-shrink: 0;
                    image-rendering: pixelated;
                }
                .qr-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.3mm;
                    min-width: 0;
                }
                .qr-code {
                    font-size: 4pt;
                    font-weight: 600;
                    color: #111827;
                    line-height: 1.1;
                    word-break: break-all;
                }
                .qr-name {
                    font-size: 3pt;
                    color: #374151;
                    line-height: 1.1;
                    word-break: break-word;
                }
                .qr-source { position: absolute; left: -99999px; top: 0; }

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
                        padding: 1mm 1.5mm;
                        border-bottom: none;
                    }
                    .qr-img {
                        width: 6.5mm;
                        height: 6.5mm;
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
