/**
 * Kartu ringkasan / KPI yang dipakai di header report.
 *
 * @param {string}            label
 * @param {string|number}     value
 * @param {string}            [subLabel]   teks kecil di bawah value
 * @param {React.ComponentType} icon       komponen ikon Phosphor
 * @param {"primary"|"success"|"warning"|"danger"|"info"} [tone]
 */
const TONES = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
    info: "bg-info-50 text-info-600",
};

const StatCard = ({ label, value, subLabel, icon: Icon, tone = "primary" }) => {
    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-neutral-white p-5">
            <div className="flex flex-col gap-1">
                <span className="text-[13px] text-gray-500">{label}</span>
                <span className="text-[22px] font-semibold text-gray-950">{value}</span>
                {subLabel && (
                    <span className="text-[11px] text-gray-400">{subLabel}</span>
                )}
            </div>
            {Icon && (
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${TONES[tone] || TONES.primary}`}>
                    <Icon size={22} weight="regular" />
                </div>
            )}
        </div>
    );
};

export default StatCard;
