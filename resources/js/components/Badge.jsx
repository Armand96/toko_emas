/**
 * Standardized status/label pill used across tables and detail views.
 *
 * Usage:
 *   <Badge tone="success">Aktif</Badge>
 *   <Badge tone="danger">Ditolak</Badge>
 *   <Badge tone="warning">Approval</Badge>
 *
 * Tones map to the existing color palette (success / danger / warning / info /
 * gray). Default tone is "gray".
 */

const TONE_CLASSES = {
    success: "bg-success-50 text-success-700 border-success-200",
    danger: "bg-danger-50 text-danger-700 border-danger-200",
    warning: "bg-warning-50 text-warning-700 border-warning-200",
    info: "bg-info-50 text-info-700 border-info-200",
    primary: "bg-primary-50 text-primary-700 border-primary-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    purple: "bg-purple-50 text-[#BA2CA9] border-[#FFC9F1]",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
};

const Badge = ({ tone = "gray", children, className = "", ...rest }) => {
    const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.gray;

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${toneClass} ${className}`}
            {...rest}
        >
            {children}
        </span>
    );
};

export default Badge;
