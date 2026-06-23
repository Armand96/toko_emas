const StatusToggle = ({
  label,
  name,
  value = false,
  isDisable,
  isRequired,
  error,
  onChange,
  options,
}) => {
  const items = options?.length
    ? options
    : [
        { value: true, label: "Active" },
        { value: false, label: "Inactive" },
      ];

  const isSelected = (optValue) => !!value === !!optValue;

  const handleSelect = (optValue) => {
    if (isDisable) return;
    onChange({
      target: {
        name: name,
        value: optValue,
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
          {label}
          {isRequired && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div
        className={`inline-flex w-fit items-center gap-1 rounded-lg  p-1 ${
          isDisable ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {items.map((opt, idx) => {
          const selected = isSelected(opt.value);
          return (
            <button
              key={idx}
              type="button"
              disabled={isDisable}
              onClick={() => handleSelect(opt.value)}
              className={`min-w-[88px] rounded-md px-4 py-1.5 text-sm font-medium transition-colors outline-none ${
                selected
                  ? "border border-primary-500 bg-primary-50 text-primary-600 shadow-sm"
                  : "border border-transparent text-gray-400 hover:text-gray-600"
              } ${isDisable ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default StatusToggle;
