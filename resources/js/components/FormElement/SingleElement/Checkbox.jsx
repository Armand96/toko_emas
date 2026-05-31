const Checkbox = ({
  label,
  name,
  value = false,
  isDisable,
  isRequired,
  error,
  onChange,
}) => {
  const handleChange = (e) => {
    onChange({
      target: {
        name: name,
        value: e.target.checked,
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        className={`flex items-center gap-2 text-sm ${
          isDisable ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          name={name}
          checked={value}
          onChange={handleChange}
          disabled={isDisable}
        />
        {label && (
          <span className="font-medium text-gray-900">
            {label}
            {isRequired && <span className="text-red-500"> *</span>}
          </span>
        )}
      </label>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default Checkbox;
