import Select from "react-select";
import {InfoIcon } from "@phosphor-icons/react";

const Dropdown = ({
  label,
  name,
  value,
  options = [],
  placeholder,
  isDisable,
  isRequired,
  error,
  onChange,
}) => {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderRadius: "0.5rem",
      backgroundColor: isDisable ? "#F3F4F6" : "#FFFFFF",
      borderColor: error
        ? "#FB2C36"
        : state.isFocused
        ? "#0C93EB"
        : "#E2E8F0",
      boxShadow: state.isFocused
        ? `0 0 0 1px ${error ? "#FB2C36" : "#0C93EB"}`
        : "none",
      "&:hover": {
        borderColor: error ? "#FB2C36" : "#0C93EB",
      },
      cursor: isDisable ? "not-allowed" : "pointer",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 12px",
      fontSize: "0.875rem",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
    }),
    singleValue: (base) => ({
      ...base,
      color: isDisable ? "#45556C" : "#121212",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.5rem",
      overflow: "hidden",
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0C93EB"
        : state.isFocused
        ? "#E0EFFE"
        : "transparent",
      color: state.isSelected ? "#FFFFFF" : "#121212",
      fontSize: "0.875rem",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#0C93EB",
      },
    }),
  };

  const selectedValue = options.find((opt) => opt.value === value) || null;

  const handleChange = (selectedOption) => {
    onChange({
      target: {
        name: name,
        value: selectedOption ? selectedOption.value : "",
      },
    });
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
          {label}
          {isRequired && <span className="text-danger-500">*</span>}
        </label>
      )}
      <Select
        name={name}
        value={selectedValue}
        onChange={handleChange}
        options={options}
        isDisabled={isDisable}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="react-select"
        isClearable
      />
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default Dropdown;
