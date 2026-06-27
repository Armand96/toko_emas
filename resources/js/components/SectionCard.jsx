const SectionCard = ({ title, badge, children, className = "" }) => {
    return (
        <div className={`flex flex-col gap-3 border border-gray-200 p-6 rounded-lg ${className}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary-500 rounded-full flex-shrink-0" />
                    <h3 className="font-semibold text-neutral-900 text-sm">{title}</h3>
                </div>
                {badge && (
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
};

export default SectionCard;
