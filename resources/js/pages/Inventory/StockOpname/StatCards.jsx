const StatCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm text-gray-500">{stat.label}</span>
                            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-primary-50/60" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatCards;
