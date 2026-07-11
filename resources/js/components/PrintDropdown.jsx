import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ActionButton from "./ActionButton";

/**
 * Print action button that opens a small dropdown of print options.
 * The menu uses fixed positioning so it is not clipped by scrollable
 * table containers (overflow-x-auto).
 *
 * Usage:
 *   <PrintDropdown
 *       title="Cetak"
 *       options={[
 *           { label: 'Cetak Kwitansi', onClick: () => handlePrint(row) },
 *           { label: 'Cetak Label', onClick: () => handlePrintLabel(row) },
 *       ]}
 *   />
 */
const MENU_WIDTH = 160;

const PrintDropdown = ({ title = "Cetak", options = [] }) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef(null);
    const menuRef = useRef(null);

    const toggleOpen = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8);
        setPosition({ top: rect.bottom + 4, left });
        setOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (containerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const closeOnScroll = () => setOpen(false);
        document.addEventListener("mousedown", close);
        window.addEventListener("scroll", closeOnScroll, true);
        window.addEventListener("resize", closeOnScroll);
        return () => {
            document.removeEventListener("mousedown", close);
            window.removeEventListener("scroll", closeOnScroll, true);
            window.removeEventListener("resize", closeOnScroll);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-block">
            <ActionButton variant="print" title={title} onClick={toggleOpen} />
            {open && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                    style={{ top: position.top, left: position.left, minWidth: MENU_WIDTH }}
                >
                    {options.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-neutral-900 hover:bg-gray-50"
                            onClick={() => {
                                setOpen(false);
                                option.onClick?.();
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

export default PrintDropdown;
