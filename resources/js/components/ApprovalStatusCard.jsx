const ApprovalStatusCard = ({
    Icon,
    iconColor,
    statusText,
    pic,
    date,
    status
}) => {
    return (
        <div className="border border-neutral-200 rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <div className="w-1 h-4 bg-info-500 rounded-full"></div>
                <h3 className="font-bold text-neutral-900">{status}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <Icon size={24} weight="fill" className={iconColor} />
                <div className="font-medium text-neutral-900">
                    {statusText} <span className="text-info-500">{pic}</span>
                    <span className="text-neutral-400 font-normal ml-2">• {date}</span>
                </div>
            </div>
        </div>
    );
};

export default ApprovalStatusCard;
