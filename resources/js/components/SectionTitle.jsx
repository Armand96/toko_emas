const SectionTitle = ({ title, color = "bg-info-500" }) => {
    return (
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <div className={`w-1 h-4 rounded-full ${color}`}></div>
            <h3 className="font-semibold text-neutral-900 text-sm">{title}</h3>
        </div>
    );
};

export default SectionTitle;
