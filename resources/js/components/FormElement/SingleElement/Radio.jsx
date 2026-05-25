import { Info, InfoIcon } from "@phosphor-icons/react";

const Radio = ({
  label,
  name,
  value,
  options = [],
  isDisable,
  isRequired,
  error,
  onChange,
  direction = "col",
}) => {
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
        {options.map((opt, idx) => (
          <label
            key={idx}
            className={`flex items-center gap-2 text-sm ${
              isDisable ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={onChange}
                disabled={isDisable}
                className="peer appearance-none w-4 h-4 border border-gray-300 rounded-full checked:border-primary-500 checked:border-[5px] transition-all outline-none"
              />
            </div>
            <span className="text-gray-900">{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default Radio;
