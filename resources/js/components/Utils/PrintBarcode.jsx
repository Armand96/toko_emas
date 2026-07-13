import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PrinterIcon, BluetoothIcon } from "@phosphor-icons/react";
import { NiimbotPrinter, canvasToBitmap, PRINTHEAD_PX } from "./Niimbotprinter";

const STORAGE_KEY = "print_barcode_data";
const QR_SOURCE_PX = 320; // resolusi source QR sebelum di-downscale ke label

// Ukuran fisik label (mm) -- dikonfirmasi 30mm x 70mm.
// Kalau roll diganti ukuran lain, angka ini WAJIB diupdate juga.
const LABEL_WIDTH_MM = 30;
const LABEL_HEIGHT_MM = 70;
const PX_PER_MM = 8; // fixed, 203dpi hardware B1/B21

// Caller ada yang kirim nilai raw (2.5 / 24) ada yang sudah berformat ("2.5g" / "24K"),
// jadi dinormalisasi dulu sebelum ditempel unit.
function formatBerat(value) {
    if (value === null || value === undefined || value === "") return "";
    const raw = String(value).replace(/\s*(gram|gr|g)$/i, "").trim();
    return raw ? `${raw}gr` : "";
}

function formatKarat(value) {
    if (value === null || value === undefined || value === "") return "";
    const raw = String(value).replace(/\s*k$/i, "").trim();
    return raw ? `${raw}K` : "";
}

function readItemsFromStorage() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], error: null };

    try {
        const parsed = JSON.parse(raw);
        const barcodes = parsed?.barcodes || [];
        const extra = parsed?.extra || {};
        const perItem = parsed?.items || extra?.items || null;

        const items = barcodes.map((code, i) => ({
            barcode: code,
            label: perItem?.[i]?.label || extra.label || extra.produk || "",
            berat: formatBerat(perItem?.[i]?.berat ?? extra.berat),
            karat: formatKarat(perItem?.[i]?.karat ?? extra.karat),
        }));

        return { items, error: null };
    } catch (error) {
        console.error("Gagal parse print_barcode_data:", error);
        return { items: [], error: "Data cetak tidak valid atau rusak." };
    }
}

function waitForNextPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// Word-wrap manual -- Canvas API gak punya built-in wrap, jadi kita ukur tiap kata sendiri.
function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let current = "";

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

// Gambar teks yang di-rotate 90 derajat (vertikal, extend ke bawah dari titik x,y)
function drawVerticalText(ctx, text, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

// Gabungin QR canvas (offscreen) + teks jadi satu canvas label, ukuran fixed sesuai fisik label.
// Layout: QR di atas (center horizontal, gak dirotate), teks di bawahnya VERTIKAL
// (rotate 90, extend ke bawah), grup kolom teks juga di-center horizontal.
function composeLabelCanvas(qrCanvas, item) {
    const widthPx = Math.min(LABEL_WIDTH_MM * PX_PER_MM, PRINTHEAD_PX);
    const heightPx = LABEL_HEIGHT_MM * PX_PER_MM;

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, widthPx, heightPx);

    const margin = 8;
    const qrSizePx = Math.round(widthPx * 0.32);
    ctx.drawImage(qrCanvas, margin, margin, qrSizePx, qrSizePx);

    const textStartX = margin + qrSizePx + 10;
    // Karena teks di-rotate 90, "panjang" teks sekarang terbatas oleh TINGGI label, bukan lebar.
    const maxTextLength = heightPx - margin * 2;

    ctx.fillStyle = "#000";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    let cursorX = textStartX; // tiap baris baru geser ke KANAN (karena teksnya vertikal)

    ctx.font = "bold 13px sans-serif";
    for (const line of wrapText(ctx, item.barcode, maxTextLength)) {
        drawVerticalText(ctx, line, cursorX, margin);
        cursorX += 15;
    }

    if (item.label) {
        cursorX += 70;
        ctx.font = "16px sans-serif";
        for (const line of wrapText(ctx, item.label, maxTextLength)) {
            drawVerticalText(ctx, line, cursorX, margin);
            cursorX += 12;
        }
    }

    const meta = [item.berat, item.karat].filter(Boolean).join(" · ");
    if (meta) {
        cursorX += 8;
        ctx.font = "bold 14px sans-serif";
        drawVerticalText(ctx, meta, cursorX, margin);
        cursorX += 16;
    }

    return canvas;
}

const PrintBarcode = () => {
    const [items, setItems] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [qrReady, setQrReady] = useState(false);
    const qrCanvasRefs = useRef({});

    const [printerStatus, setPrinterStatus] = useState("disconnected"); // disconnected | connecting | connected
    const [printProgress, setPrintProgress] = useState(null); // { current, total } | null
    const [printError, setPrintError] = useState(null);
    const printerRef = useRef(null);

    useEffect(() => {
        const { items, error } = readItemsFromStorage();
        setItems(items);
        setLoadError(error);
    }, []);

    useEffect(() => {
        if (items.length === 0) {
            setQrReady(false);
            return;
        }
        let cancelled = false;
        setQrReady(false);
        waitForNextPaint().then(() => {
            if (!cancelled) setQrReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, [items]);

    async function handleConnect() {
        setPrintError(null);
        setPrinterStatus("connecting");
        try {
            printerRef.current = new NiimbotPrinter();
            await printerRef.current.connect();
            setPrinterStatus("connected");
        } catch (err) {
            console.error(err);
            setPrintError("Gagal connect ke printer: " + err.message);
            setPrinterStatus("disconnected");
        }
    }

    async function handlePrintAll() {
        if (!printerRef.current || printerStatus !== "connected") return;
        setPrintError(null);

        for (let i = 0; i < items.length; i++) {
            setPrintProgress({ current: i + 1, total: items.length });
            try {
                const qrCanvas = qrCanvasRefs.current[i];
                if (!qrCanvas) continue;
                const labelCanvas = composeLabelCanvas(qrCanvas, items[i]);
                const bitmap = canvasToBitmap(labelCanvas);
                await printerRef.current.printLabel(bitmap);
            } catch (err) {
                console.error(err);
                setPrintError(`Gagal print label ke-${i + 1} (${items[i].barcode}): ${err.message}`);
                break;
            }
        }

        setPrintProgress(null);
    }

    const canPrint = printerStatus === "connected" && qrReady && items.length > 0 && !printProgress;

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-4">
            <div className="w-full max-w-md flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Cetak Label (NIIMBOT)</h1>
                    <p className="text-sm text-gray-500">{items.length} label siap dicetak</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleConnect}
                        disabled={printerStatus === "connecting" || printerStatus === "connected"}
                        className="px-3 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <BluetoothIcon size={18} />
                        {printerStatus === "connected"
                            ? "Terhubung"
                            : printerStatus === "connecting"
                            ? "Menghubungkan..."
                            : "Connect"}
                    </button>
                    <button
                        onClick={handlePrintAll}
                        disabled={!canPrint}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <PrinterIcon size={18} />
                        {printProgress ? `${printProgress.current}/${printProgress.total}` : "Print Semua"}
                    </button>
                </div>
            </div>

            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {printError && <p className="text-sm text-red-600 max-w-md">{printError}</p>}
            {printerStatus === "disconnected" && items.length > 0 && (
                <p className="text-xs text-gray-400 max-w-md text-center">
                    Klik Connect dulu, pilih printer NIIMBOT dari daftar Bluetooth (Chrome/Edge only).
                </p>
            )}

            {/* QR source disembunyikan -- cuma dipakai buat digambar ulang ke canvas label */}
            <div style={{ position: "absolute", left: -99999, top: 0 }} aria-hidden="true">
                {items.map((item, index) => (
                    <QRCodeCanvas
                        key={`${item.barcode}-${index}`}
                        value={item.barcode}
                        size={QR_SOURCE_PX}
                        level="M"
                        marginSize={2}
                        ref={(el) => (qrCanvasRefs.current[index] = el)}
                    />
                ))}
            </div>

            {/* Preview visual di layar (bukan yang dikirim ke printer, cuma referensi) */}
            <div className="flex flex-col gap-2 w-full max-w-md">
                {items.length === 0 && !loadError && (
                    <p className="text-sm text-gray-500 text-center py-8">Tidak ada data untuk dicetak.</p>
                )}
                {items.map((item, index) => (
                    <div
                        key={`${item.barcode}-${index}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-[8px] text-gray-400">
                            QR
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{item.barcode}</p>
                            {(item.label || item.berat || item.karat) && (
                                <p className="text-xs text-gray-500">
                                    {[item.label, item.berat, item.karat].filter(Boolean).join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrintBarcode;