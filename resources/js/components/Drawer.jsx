import { useEffect } from "react";
import { XIcon } from "@phosphor-icons/react";

// Bottom-sheet drawer. Muncul dari bawah, ada backdrop, tutup via backdrop/X/Esc.
const Drawer = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        if (isOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-neutral-black/50 transition-opacity ${
                    isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
                    isOpen ? "translate-y-0" : "translate-y-full"
                }`}
                role="dialog"
                aria-modal="true"
            >
                <div className="mx-auto w-full max-w-lg">
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        >
                            <XIcon size={18} weight="bold" />
                        </button>
                    </div>
                    <div className="px-5 pb-6 pt-2">{children}</div>
                </div>
            </div>
        </>
    );
};

export default Drawer;
