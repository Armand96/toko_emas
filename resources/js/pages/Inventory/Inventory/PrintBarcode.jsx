import { useEffect, useState } from "react";
import Barcode from "react-barcode";
import { PrinterIcon } from "@phosphor-icons/react";

const PrintBarcode = () => {
    const [items, setItems] = useState([]);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Cetak Barcode</h1>
                        <p className="text-sm text-gray-500">
                            {items.length} barcode siap dicetak
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="btn-primary py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                        <PrinterIcon size={20} /> Cetak
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-6 rounded-lg border border-gray-200 print:border-none">
                    {items.length === 0 && (
                        <p className="text-sm text-gray-500 col-span-full text-center py-8">
                            Tidak ada data barcode untuk dicetak.
                        </p>
                    )}
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center justify-center gap-1 rounded-lg p-3"
                        >
                            <Barcode value={item.barcode} width={1.4} height={45} fontSize={12} margin={4} />
                            {item.label && (
                                <span className="text-xs text-gray-600 text-center">{item.label}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrintBarcode;
