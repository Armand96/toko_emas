import { useEffect, useState } from 'react';
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
                const rect = sidebar.getBoundingClientRect();
                const isHidden = rect.width === 0 || window.innerWidth < 1024;
                setLeftOffset(isHidden ? 0 : rect.width);
            }
        };

        updateOffset();

        const resizeObserver = new ResizeObserver(updateOffset);
        const sidebar = document.querySelector(sidebarSelector);
        if (sidebar) resizeObserver.observe(sidebar);

        window.addEventListener('resize', updateOffset);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateOffset);
        };
    }, [sidebarSelector]);

    if (!selectedCount || selectedCount === 0) return null;

    const getButtonClass = (type) => {
        const baseClass = "flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-md transition-colors font-medium text-xs lg:text-sm cursor-pointer ";
        if (type === 'danger') {
            return baseClass + "btn-danger";
        }
        return baseClass + "btn-primary";
    };

    const bar = (
        <div
            className="fixed bottom-0 right-0 bg-neutral-white shadow-[0_-4px_10px_rgba(0,0,0,0.08)] border-t border-neutral-200 px-4 lg:px-8 py-3 lg:py-4 z-50 animate-[slideUp_0.3s_ease-out] transition-[left] duration-300"
            style={{ left: `${leftOffset}px` }}
        >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between max-w-full">
                <span className="text-xs lg:text-sm font-semibold text-neutral-800">
                    {selectedCount} Data Terpilih
                </span>
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={onClearSelection} className="flex-1 lg:flex-none text-xs lg:text-sm btn-outline px-3 lg:px-4 py-1.5 lg:py-2 rounded-md">
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
