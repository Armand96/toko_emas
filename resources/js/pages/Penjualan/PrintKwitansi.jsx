import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { PrinterIcon } from "@phosphor-icons/react";
import HelperFunctions from "../../utils/HelperFunctions";

const PrintKwitansi = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const raw = sessionStorage.getItem("print_kwitansi_data");
        if (!raw) return;

        try {
            setData(JSON.parse(raw));
        } catch (error) {
            console.error(error);
        }
    }, []);

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-sm text-gray-500">Tidak ada data kwitansi untuk dicetak.</p>
            </div>
        );
    }

    const { customer, user, details, branch, order_id, sub_total, grand_total, payment_type, created_at } = data;
    const isTransfer = payment_type === 'TRANSFER';

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Cetak Kwitansi</h1>
                        <p className="text-sm text-gray-500">Order ID {order_id}</p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="btn-primary py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                        <PrinterIcon size={20} /> Cetak
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 print:border-none flex flex-col gap-4 text-sm">
                    <div className="text-center flex flex-col gap-1 border-b border-dashed border-neutral-300 pb-4">
                        <span className="text-base font-bold text-neutral-900">{branch?.branch_name ?? 'Toko Emas'}</span>
                        <span className="text-xs text-neutral-500">{branch?.address ?? '-'}</span>
                        <span className="text-xs text-neutral-500 mt-1">KWITANSI PENJUALAN</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-dashed border-neutral-300 pb-3">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Order ID</span>
                            <span className="font-medium text-neutral-900">{order_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Tanggal</span>
                            <span className="font-medium text-neutral-900">{created_at ? dayjs(created_at).format('DD/MM/YYYY HH:mm') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Kasir</span>
                            <span className="font-medium text-neutral-900">{user?.name ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Customer</span>
                            <span className="font-medium text-neutral-900">{customer?.customer_name ?? '-'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-b border-dashed border-neutral-300 pb-3">
                        {(details || []).map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium text-neutral-900">{item.product?.product_name ?? '-'}</span>
                                    <span className="text-xs text-neutral-500">
                                        {item.inventory_code}
                                        {item.inventory?.berat ? ` • ${item.inventory.berat}g` : ''}
                                        {item.inventory?.karat ? ` • ${item.inventory.karat}K` : ''}
                                    </span>
                                </div>
                                <span className="font-medium text-neutral-900">{HelperFunctions.formatCurrency(item.price)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-1 border-b border-dashed border-neutral-300 pb-3">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Sub Total</span>
                            <span className="font-medium text-neutral-900">{HelperFunctions.formatCurrency(sub_total)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="text-neutral-900">Total</span>
                            <span className="text-neutral-900">{HelperFunctions.formatCurrency(grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 mt-1">
                            <span>Pembayaran</span>
                            <span>{isTransfer ? 'Transfer' : 'Tunai'}</span>
                        </div>
                    </div>

                    <div className="text-center text-xs text-neutral-500">
                        Terima kasih atas kepercayaan Anda
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintKwitansi;
