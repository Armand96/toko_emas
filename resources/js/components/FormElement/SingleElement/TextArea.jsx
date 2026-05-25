import { Info, InfoIcon, WarningCircle, WarningCircleIcon } from "@phosphor-icons/react";

const TextArea = ({
  label,
  name,
  value,
  placeholder,
  isDisable,
  isRequired,
  error,
  onChange,
  rows = 3,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
          {label}
          {isRequired && <span className="text-danger-500">*</span>}
          <InfoIcon size={14} className="text-gray-400" />
        </label>
      )}
      <div className="relative">
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={isDisable}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all duration-200 resize-none
            ${
              isDisable
                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                : error
                ? "border-danger-500 focus:border-danger-500 focus:ring-1 focus:ring-danger-500"
                : "border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-black"
            }
          `}
        />
        {error && (
          <WarningCircleIcon
            size={18}
            className="absolute right-3 top-3 text-danger-500"
          />
        )}
      </div>
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default TextArea;
