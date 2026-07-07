import { useState } from "react";
import { PrinterIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import GenerateQR from "../../../components/Utils/GenerateQR";

import ModalCustom from "../../../components/modalCustom";
import SectionTitle from "../../../components/SectionTitle";
import Badge from "../../../components/Badge";

import HelperFunctions from "../../../utils/HelperFunctions";

const STATUS_TONE = {
    Available: "success",
    Transit:   "warning",
    Sold:      "gray",
    Repair:    "info",
    Lost:      "danger",
};

const RiwayatItem = ({ item }) => {
    const [open, setOpen] = useState(false);
    const hasDetail = item.changes && item.changes.length > 0;

    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="w-px flex-1 bg-gray-200" />
            </div>
            <div className="flex-1 pb-4">
                <button
                    type="button"
                    onClick={() => hasDetail && setOpen((p) => !p)}
                    className={`flex items-center gap-2 w-full text-left ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
                >
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">
                            {item.actor ? `${item.actor} · ` : ""}{item.date}
                        </p>
                        {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                    </div>
                    {hasDetail && (
                        open ? <CaretUpIcon size={16} className="text-gray-400" /> : <CaretDownIcon size={16} className="text-gray-400" />
                    )}
                </button>

                {hasDetail && open && (
                    <div className="mt-2 rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500 mb-2">
                            {item.initial ? "Nilai awal item" : `${item.changes.length} field diperbarui`}
                        </p>
                        <div className="flex flex-col gap-2">
                            {item.changes.map((change, idx) => (
                                <div key={idx}>
                                    <p className="text-xs text-gray-600 mb-1">{change.label}</p>
                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                        {item.initial ? (
                                            <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 break-words">{change.to}</span>
                                        ) : (
                                            <>
                                                <span className="px-2 py-0.5 rounded-md bg-danger-50 text-danger-500 line-through break-words">{change.from}</span>
                                                <span className="text-gray-400">{"→"}</span>
                                                <span className="px-2 py-0.5 rounded-md bg-success-50 text-success-600 break-words">{change.to}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailItemModal = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    const margin = (item.jual || 0) - (item.modal || 0);
    const marginPct = item.modal ? ((margin / item.modal) * 100).toFixed(1) : 0;

    const handlePrintBarcode = () => {
        HelperFunctions.printBarcode(item.inventory_code, { label: item.produk });
    };

    return (
        <ModalCustom
            isOpen={isOpen}
            onClose={onClose}
            title="Detail Item Inventory"
            size="md"
            footer={false}
        >
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-4 min-w-0">
                <div className="w-full sm:w-64 flex flex-col gap-2 flex-shrink-0 min-w-0">
                    <img
                        src={item.image}
                        alt={item.produk}
                        className="w-full h-64 rounded-lg object-cover bg-gray-100 border border-gray-200"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div className="w-full border border-gray-200 rounded-lg p-3 overflow-hidden flex flex-col items-center gap-1">
                        <GenerateQR value={item.inventory_code} size={64} />
                    </div>
                    <button
                        type="button"
                        onClick={handlePrintBarcode}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm btn-outline rounded-md cursor-pointer"
                    >
                        <PrinterIcon size={16} /> Cetak QR Code
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <div className="flex items-center justify-between">
                                <p className="text-base font-semibold text-gray-900">{item.produk}</p>
                                <Badge tone={STATUS_TONE[item.status] || "gray"}>{item.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                                {item.berat} {"·"} {item.karat} {item.no_seri ? `· ${item.no_seri}` : ""}
                            </p>

                            {item.jual > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">Harga Jual</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {HelperFunctions.formatCurrency(item.jual)}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <div>
                                    <p className="text-xs text-gray-500">Harga Modal</p>
                                    <p className="text-sm text-gray-700">{HelperFunctions.formatCurrency(item.modal)}</p>
                                </div>
                                {item.jual > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${margin >= 0 ? "bg-success-100 text-success-700" : "bg-danger-100 text-danger-700"}`}>
                                        Margin keuntungan {margin >= 0 ? "↗" : "↘"} {HelperFunctions.formatCurrency(Math.abs(margin))} ({margin >= 0 ? "+" : "-"}{Math.abs(marginPct)}%)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-sm border-t border-gray-100 pt-3">
                            <div className="flex">
                                <span className="w-28 flex-shrink-0 text-gray-500">Kategori</span>
                                <span className="text-gray-900">{item.kategori}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 flex-shrink-0 text-gray-500">Sub Kategori</span>
                                <span className="text-gray-900">{item.sub_kategori || "-"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 flex-shrink-0 text-gray-500">Cabang</span>
                                <span className="text-gray-900">{item.cabang}</span>
                            </div>
                            {item.keterangan && (
                                <div className="flex">
                                    <span className="w-28 flex-shrink-0 text-gray-500">Deskripsi</span>
                                    <span className="text-gray-900">{item.keterangan}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {item.riwayat && item.riwayat.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                            <SectionTitle title="Riwayat" />
                            <div className="flex flex-col">
                                {item.riwayat.map((r, idx) => (
                                    <RiwayatItem key={idx} item={r} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalCustom>
    );
};

export default DetailItemModal;
