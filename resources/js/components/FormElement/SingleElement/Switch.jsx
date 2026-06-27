import ReactSwitch from "react-switch";
import { Info } from "@phosphor-icons/react";

const Switch = ({
  label,
  name,
  value,
  isDisable,
  isRequired,
  error,
  onChange,
}) => {
  const handleChange = (checked) => {
    onChange({
      target: {
        name: name,
        value: checked,
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
          {label}
          {isRequired && <span className="text-danger-500">*</span>}
          <Info size={14} className="text-gray-400" />
        </label>
      )}
      <div className={`flex items-center ${isDisable ? "opacity-60 cursor-not-allowed" : ""}`}>
        <ReactSwitch
          checked={!!value}
          onChange={handleChange}
          disabled={isDisable}
          onColor="#0C93EB"
          offColor="#D1D5DB"
          activeBoxShadow="0 0 2px 3px rgba(12, 147, 235, 0.2)"
          uncheckedIcon={false}
          checkedIcon={false}
          height={20}
          width={40}
          handleDiameter={16}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          className="react-switch"
        />
      </div>
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default Switch;
