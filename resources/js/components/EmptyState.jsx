const EmptyState = ({ message = "Belum ada data", className = "" }) => {
    return (
        <div
            className={`text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl ${className}`}
        >
            {message}
        </div>
    );
};

export default EmptyState;
