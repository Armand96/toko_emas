import Select, { components } from "react-select";
import { CheckIcon } from "@phosphor-icons/react";

/**
 * Dropdown multi-select (banyak pilihan sekaligus).
 * - value: array of value (mis. [1, 2, 3]).
 * - onChange: { target: { name, value: [...] } } — selalu array.
 * Mengikuti style Dropdown.jsx agar konsisten, ditambah:
 *   - chip terpilih dengan ringkasan "+N lainnya" bila melebihi maxChips.
 *   - checkmark pada opsi yang dipilih.
 *   - footer "N dipilih" + tombol Reset.
 */
const MultiDropdown = ({
  label,
  name,
  value = [],
  options = [],
  placeholder,
  isDisable,
  isRequired,
  error,
  onChange,
  maxChips = 2,
}) => {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderRadius: "0.5rem",
      backgroundColor: isDisable ? "#F3F4F6" : "#FFFFFF",
      borderColor: error ? "#FB2C36" : state.isFocused ? "#0C93EB" : "#E2E8F0",
      boxShadow: state.isFocused ? `0 0 0 1px ${error ? "#FB2C36" : "#0C93EB"}` : "none",
      "&:hover": { borderColor: error ? "#FB2C36" : "#0C93EB" },
      cursor: isDisable ? "not-allowed" : "pointer",
    }),
    valueContainer: (base) => ({ ...base, padding: "2px 12px", fontSize: "0.875rem", gap: "4px" }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#F1F5F9",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base) => ({ ...base, color: "#121212", fontSize: "0.8125rem" }),
    menu: (base) => ({ ...base, borderRadius: "0.5rem", overflow: "hidden", zIndex: 50 }),
    menuList: (base) => ({ ...base, paddingBottom: 0 }),
    option: (base, state) => ({
      ...base,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: state.isSelected ? "#E0EFFE" : state.isFocused ? "#F1F5F9" : "transparent",
      color: "#121212",
      fontSize: "0.875rem",
      cursor: "pointer",
      "&:active": { backgroundColor: "#E0EFFE" },
    }),
  };

  const selectedValues = options.filter((opt) => (value || []).includes(opt.value));

  const handleChange = (selected) => {
    onChange({
      target: {
        name,
        value: selected ? selected.map((s) => s.value) : [],
      },
    });
  };

  // Tampilkan hanya maxChips chip; sisanya jadi "+N lainnya".
  const MultiValue = (props) => {
    const idx = props.selectProps.value.findIndex((v) => v.value === props.data.value);
    if (idx < maxChips) return <components.MultiValue {...props} />;
    if (idx === maxChips) {
      const rest = props.selectProps.value.length - maxChips;
      return (
        <span className="px-1.5 text-[0.8125rem] text-gray-500">+{rest} lainnya</span>
      );
    }
    return null;
  };

  // Opsi dengan checkmark di kanan bila terpilih.
  const Option = (props) => (
    <components.Option {...props}>
      <span>{props.label}</span>
      {props.isSelected && <CheckIcon size={16} weight="bold" className="text-primary-500" />}
    </components.Option>
  );

  // Footer: "N dipilih" + Reset.
  const Menu = (props) => (
    <components.Menu {...props}>
      {props.children}
      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
        <span>{(value || []).length} dipilih</span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleChange([]);
          }}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Reset
        </button>
      </div>
    </components.Menu>
  );

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
          {label}
          {isRequired && <span className="text-danger-500">*</span>}
        </label>
      )}
      <Select
        isMulti
        name={name}
        value={selectedValues}
        onChange={handleChange}
        options={options}
        isDisabled={isDisable}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="react-select"
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        components={{ MultiValue, Option, Menu }}
      />
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
};

export default MultiDropdown;
