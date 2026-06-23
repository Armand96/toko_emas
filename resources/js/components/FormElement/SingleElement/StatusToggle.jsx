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
        { value: true, label: "Aktif" },
        { value: false, label: "Tidak Aktif" },
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
              className={`min-w-[100px] rounded-md px-5 py-2 text-sm font-medium transition-colors outline-none ${
                isDisable
                  ? selected
                    ? "border border-[#E2E8F0] bg-[#F3F4F6] text-[#45556C]"
                    : "border border-[#E2E8F0] text-[#9CA3AF]"
                  : selected
                    ? "border border-primary-500 bg-white text-primary-600"
                    : "border border-gray-200 bg-gray-100 text-[#62748E]"
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
