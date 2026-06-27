import {
    EyeIcon,
    PencilSimpleLineIcon,
    TrashIcon,
    BankIcon,
    PrinterIcon,
    XIcon,
    ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";

/**
 * Standardized action button used inside table "Aksi" columns.
 *
 * Usage:
 *   <ActionButton variant="view" onClick={() => handleOpenModal('view', row)} />
 *   <ActionButton variant="edit" onClick={() => handleOpenModal('edit', row)} />
 *   <ActionButton variant="delete" onClick={() => handleDelete(row)} />
 *   <ActionButton variant="bank" onClick={() => handleOpenModal('bank', row)} />
 *
 * For a one-off icon/behaviour, pass `icon`, `title` and `tone` directly:
 *   <ActionButton icon={SomeIcon} title="Batalkan" tone="danger" onClick={...} />
 *
 * Wrap a group with <ActionButtonGroup> to get consistent spacing.
 */

const VARIANTS = {
    view: { icon: EyeIcon, title: "Lihat", tone: "default" },
    edit: { icon: PencilSimpleLineIcon, title: "Ubah", tone: "warning" },
    delete: { icon: TrashIcon, title: "Hapus", tone: "danger" },
    bank: { icon: BankIcon, title: "Bank", tone: "warning" },
    print: { icon: PrinterIcon, title: "Cetak", tone: "warning" },
    cancel: { icon: XIcon, title: "Batalkan", tone: "danger" },
    restore: { icon: ArrowCounterClockwiseIcon, title: "Kembalikan", tone: "success" },
};

// All neutral variants share the same gray border so the row of buttons looks
// uniform; only the hover tint differentiates them. Colored variants (danger /
// success) carry their own border + icon color.
const TONE_CLASSES = {
    default: "btn-outline !border-gray-200 hover:bg-info-50",
    warning: "btn-outline !border-[#0079D3] hover:bg-warning-50",
    // destructive: red icon + red border, red-tinted hover
    danger: "btn-outline !text-danger-500 !border-danger-200 hover:bg-danger-50",
    // positive action (e.g. kembalikan ke inventory)
    success: "btn-outline !text-success-600 !border-success-200 hover:bg-success-50",
};

const ActionButton = ({
    variant,
    icon: iconProp,
    title: titleProp,
    tone: toneProp,
    onClick,
    disabled = false,
    size = 20,
    className = "",
    type = "button",
    ...rest
}) => {
    const preset = (variant && VARIANTS[variant]) || {};
    const Icon = iconProp || preset.icon;
    const title = titleProp ?? preset.title;
    const tone = toneProp || preset.tone || "default";

    if (!Icon) return null;

    const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.default;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-md transition-colors duration-200 ${toneClass} ${className}`}
            {...rest}
        >
            <Icon size={size} />
        </button>
    );
};

export const ActionButtonGroup = ({ children, className = "" }) => (
    <div className={`flex items-center gap-2 ${className}`}>{children}</div>
);

export default ActionButton;
