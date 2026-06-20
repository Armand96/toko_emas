const StatCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-gray-500">{stat.label}</span>
                                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                            </div>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg || 'bg-primary-50/60'}`}>
                                {Icon && <Icon size={20} weight="fill" className={stat.iconColor || 'text-primary-500'} />}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatCards;
