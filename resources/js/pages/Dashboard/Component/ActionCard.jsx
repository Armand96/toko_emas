import { CaretRightIcon } from "@phosphor-icons/react";

/**
 * Kartu pintasan pengajuan yang menunggu persetujuan, dipakai di banner
 * "Perlu tindakan" pada dashboard.
 *
 * @param {string} label   nama jenis pengajuan (Penjualan, Pembelian, dsb)
 * @param {number} count   jumlah pengajuan menunggu
 * @param {() => void} [onClick]
 */
const ActionCard = ({ label, count, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-neutral-white p-4 text-left transition-colors duration-200 hover:border-primary-300 hover:bg-primary-50/40 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
        >
            <div className="flex flex-col gap-1">
                <span className="text-[13px] text-gray-500">{label}</span>
                <span className="text-[22px] font-semibold text-gray-950">{count}</span>
            </div>
            <CaretRightIcon
                size={18}
                weight="bold"
                className="shrink-0 text-gray-300 transition-colors duration-200 group-hover:text-primary-500"
            />
        </button>
    );
};

export default ActionCard;
