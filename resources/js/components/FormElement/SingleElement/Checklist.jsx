import { Info, Check, CheckIcon, InfoIcon } from "@phosphor-icons/react";

const Checklist = ({
  label,
  name,
  value = [],
  options = [],
  isDisable,
  isRequired,
  error,
  onChange,
  direction = "col",
}) => {
  const handleCheckboxChange = (e, optValue) => {
    const isChecked = e.target.checked;
    let newValue = [...value];

    if (isChecked) {
      newValue.push(optValue);
    } else {
      newValue = newValue.filter((v) => v !== optValue);
    }

    onChange({
      target: {
        name: name,
        value: newValue,
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
        className={`flex ${
          direction === "row" ? "flex-row gap-6" : "flex-col gap-3"
        }`}
      >
        {options.map((opt, idx) => {
          const isChecked = value.includes(opt.value);
          return (
            <label
              key={idx}
              className={`flex items-center gap-2 text-sm ${
                isDisable ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name={name}
                  value={opt.value}
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(e, opt.value)}
                  disabled={isDisable}
                  className="peer appearance-none w-4 h-4 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 checked:bg-primary-500 checked:border-primary-500 transition-all outline-none"
                />
                <CheckIcon
                  size={12}
                  weight="bold"
                  className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                />
              </div>
              <span className="text-gray-900">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default Checklist;
