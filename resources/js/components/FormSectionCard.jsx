const FormSectionCard = ({ title, divider = true, children, className = "" }) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
            <div
                className={`flex items-center gap-2 mb-6  pb-3 border-b border-b-[#E2E8F0] `}
            >
                <div className="w-1 h-4 bg-primary-500 rounded-full flex-shrink-0"></div>
                <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            </div>
            {children}
        </div>
    );
};

export default FormSectionCard;
