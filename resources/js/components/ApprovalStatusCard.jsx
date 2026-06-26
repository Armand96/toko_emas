const ApprovalStatusCard = ({
    Icon,
    iconColor,
    statusText,
    pic,
    date,
    status,
    reasonLabel,
    reason
}) => {
    return (
        <div className="border border-neutral-200 rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <div className="w-1 h-4 bg-info-500 rounded-full"></div>
                <h3 className="font-semibold text-neutral-900 text-sm">{status}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <Icon size={24} weight="fill" className={iconColor} />
                <div className="font-medium text-neutral-900">
                    {statusText} <span className="text-info-500">{pic}</span>
                    <span className="text-neutral-400 font-normal ml-2">• {date}</span>
                </div>
            </div>
            {reason && (
                <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                    {reasonLabel && <span className="font-medium">{reasonLabel}: </span>}
                    {reason}
                </div>
            )}
        </div>
    );
};

export default ApprovalStatusCard;
