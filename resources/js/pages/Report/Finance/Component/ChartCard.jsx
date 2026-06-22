/**
 * Pembungkus kartu untuk chart / section di halaman report.
 *
 * @param {string} title
 * @param {string} [subtitle]
 * @param {React.ReactNode} [action]   elemen di pojok kanan header (dropdown, dsb)
 * @param {React.ReactNode} children
 * @param {string} [className]
 */
const ChartCard = ({ title, subtitle, action, children, className = "" }) => {
    return (
        <div className={`flex flex-col rounded-lg border border-gray-200 bg-neutral-white p-5 ${className}`}>
            {(title || action) && (
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        {title && <h3 className="text-base font-semibold text-gray-950">{title}</h3>}
                        {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default ChartCard;
