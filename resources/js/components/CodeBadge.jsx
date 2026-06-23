const VARIANTS = {
    default: "px-3 py-1 bg-gray-50 text-gray-500 rounded text-xs font-medium border border-gray-200",
    blue: "px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold tracking-wide border border-blue-100",
    table: "inline-flex items-center px-2.5 py-1 rounded-lg border border-gray-200 bg-[#F8FAFC] text-xs font-medium text-gray-700",
};

const CodeBadge = ({ children, variant = "default", className = "", shrink = true }) => {
    const base = VARIANTS[variant] || VARIANTS.default;
    const shrinkClass = shrink ? "flex-shrink-0" : "";

    return (
        <span className={`${base} ${shrinkClass} ${className}`}>
            {children}
        </span>
    );
};

export default CodeBadge;
