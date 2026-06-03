import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const FooterActionBar = ({
    selectedCount,
    onClearSelection,
    primaryText,
    primaryType = 'primary',
    primaryIcon,
    onPrimaryClick,
    secondaryText,
    secondaryType = 'danger',
    secondaryIcon,
    onSecondaryClick,
    sidebarSelector = 'aside',
}) => {
    const [leftOffset, setLeftOffset] = useState(0);

    useEffect(() => {
        const updateOffset = () => {
            const sidebar = document.querySelector(sidebarSelector);
            if (sidebar) {
                setLeftOffset(sidebar.getBoundingClientRect().width);
            }
        };

        updateOffset();

        const resizeObserver = new ResizeObserver(updateOffset);
        const sidebar = document.querySelector(sidebarSelector);
        if (sidebar) resizeObserver.observe(sidebar);

        return () => resizeObserver.disconnect();
    }, [sidebarSelector]);

    if (!selectedCount || selectedCount === 0) return null;

    const getButtonClass = (type) => {
        const baseClass = "flex items-center gap-2 px-4 py-2 rounded-md transition-colors font-medium text-sm cursor-pointer ";
        if (type === 'danger') {
            return baseClass + "btn-danger";
        }
        return baseClass + "btn-primary";
    };

    const bar = (
        <div
            className="fixed bottom-0 right-0 bg-neutral-white shadow-[0_-4px_10px_rgba(0,0,0,0.08)] border-t border-neutral-200 px-6 lg:px-8 py-4 z-50 animate-[slideUp_0.3s_ease-out] transition-[left] duration-300"
            style={{ left: `${leftOffset}px` }}
        >
            <div className="flex items-center justify-between max-w-full">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-neutral-800">
                        {selectedCount} Data Terpilih
                    </span>
                    <div className="h-4 w-px bg-neutral-300" />

                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onClearSelection} className="text-sm btn-outline px-4 py-2 rounded-md ">
                        Batal
                    </button>
                    {secondaryText && (
                        <button onClick={onSecondaryClick} className={getButtonClass(secondaryType)}>
                            {secondaryIcon}
                            {secondaryText}
                        </button>
                    )}
                    {primaryText && (
                        <button onClick={onPrimaryClick} className={getButtonClass(primaryType)}>
                            {primaryIcon}
                            {primaryText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(bar, document.body);
};

export default FooterActionBar;
