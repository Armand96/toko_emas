/**
 * Kartu statistik ringkas dengan aksen garis kiri berwarna.
 * Dipakai untuk status sekunder inventory (In Repair / Transit / Lost / Sold).
 *
 * @param {string}        label
 * @param {string|number} value
 * @param {"primary"|"success"|"warning"|"danger"|"info"|"gray"} [tone]
 */
const ACCENTS = {
    primary: "bg-primary-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    info: "bg-info-500",
    gray: "bg-gray-500",
};

const MiniStatCard = ({ label, value, tone = "gray" }) => {
    return (
        <div className="flex items-stretch gap-3 rounded-lg border border-gray-200 bg-neutral-white p-5">
            <div className={`w-1 shrink-0 rounded-full ${ACCENTS[tone] || ACCENTS.gray}`} />
            <div className="flex flex-col gap-1">
                <span className="text-[13px] text-gray-500">{label}</span>
                <span className="text-[22px] font-semibold text-gray-950">{value}</span>
            </div>
        </div>
    );
};

export default MiniStatCard;
