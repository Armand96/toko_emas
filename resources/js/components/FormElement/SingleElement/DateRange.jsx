import { useEffect, useRef, useState } from "react";
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";

/**
 * Filter rentang tanggal ala mockup report, dipakai lewat InputGroup
 * dengan type: "daterange".
 *
 * Nilai (value) berbentuk objek: { mode: "all" | "range", start, end }.
 * onChange mengikuti pola SingleElement lain:
 *   onChange({ target: { name, value: {mode, start, end} } })
 *
 * @param {string} name
 * @param {{mode:"all"|"range", start:string, end:string}} value
 * @param {string} [label]
 * @param {boolean} [isRequired]
 * @param {function} onChange   dipanggil saat user klik "Terapkan" / "Reset"
 */
const DEFAULT_VALUE = { mode: "all", start: "", end: "" };

const DateRange = ({ label, name, value, isRequired, onChange }) => {
    const current = value || DEFAULT_VALUE;
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(current);
    const ref = useRef(null);

    useEffect(() => setDraft(current), [value]);

    // tutup saat klik di luar panel atau tekan Escape
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const handleKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    const display =
        current.mode === "range" && current.start && current.end
            ? `${dayjs(current.start).format("DD/MM/YYYY")} - ${dayjs(current.end).format("DD/MM/YYYY")}`
            : "Semua Waktu";

    const emit = (val) => onChange?.({ target: { name, value: val } });

    const handleApply = () => {
        emit(draft);
        setOpen(false);
    };

    const handleReset = () => {
        const reset = { ...DEFAULT_VALUE };
        setDraft(reset);
        emit(reset);
        setOpen(false);
    };

    return (
        <div className="flex w-full flex-col gap-1">
            {label && (
                <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    {label}
                    {isRequired && <span className="text-danger-500">*</span>}
                </label>
            )}
            <div className="relative" ref={ref}>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex w-full min-w-[220px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-neutral-white px-3.5 py-2.5 text-sm text-gray-900 transition-colors hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                    <span className="flex items-center gap-2">
                        <CalendarBlankIcon size={18} className="text-gray-400" />
                        {display}
                    </span>
                    <CaretDownIcon size={16} className="text-gray-400" />
                </button>

                {open && (
                    <div className="absolute left-0 z-50 mt-2 w-max rounded-lg border border-gray-200 bg-neutral-white p-2.5 shadow-lg">
                        {/* Toggle mode */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setDraft({ ...draft, mode: "all" })}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${draft.mode === "all"
                                    ? "border-primary-500 bg-primary-50 text-primary-600"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Semua Waktu
                            </button>
                            <button
                                type="button"
                                onClick={() => setDraft({ ...draft, mode: "range" })}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${draft.mode === "range"
                                    ? "border-primary-500 bg-primary-50 text-primary-600"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Periode Tanggal
                            </button>
                        </div>

                        {/* Input rentang tanggal */}
                        <div className={`mt-2.5 ${draft.mode === "range" ? "" : "pointer-events-none opacity-40"}`}>
                            <span className="text-xs font-medium text-gray-500">Periode Tanggal</span>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <input
                                    type="date"
                                    value={draft.start}
                                    max={draft.end || undefined}
                                    onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                                    className="w-[130px] rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                                <span className="text-xs text-gray-400">s.d.</span>
                                <input
                                    type="date"
                                    value={draft.end}
                                    min={draft.start || undefined}
                                    onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                                    className="w-[130px] rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Action */}
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={draft.mode === "range" && (!draft.start || !draft.end)}
                                className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-neutral-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateRange;
