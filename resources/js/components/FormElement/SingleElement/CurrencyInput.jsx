import HelperFunctions from "../../../utils/HelperFunctions";

const spanClasses = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
};

const DesktopSpanClasses = {
    1: 'lg:col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
};

const CurrencyInput = ({
    label,
    name,
    value,
    placeholder = "0",
    isDisable,
    isRequired,
    error,
    colSpan = '1',
    deskSpan = colSpan,
    onChange,
}) => {
    const displayValue = value ? HelperFunctions.formatNumberInput(value) : '';

    const handleChange = (e) => {
        const raw = HelperFunctions.unformatNumberInput(e.target.value);
        onChange?.({ target: { name, value: raw } });
    };

    return (
        <div className={`flex flex-col gap-1 w-full ${spanClasses[colSpan] || ''} ${DesktopSpanClasses[deskSpan] || ''}`}>
            {label && (
                <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    {label}
                    {isRequired && <span className="text-danger-500">*</span>}
                </label>
            )}
            <div className="relative flex items-center">
                <span className={`absolute left-3 text-sm font-medium select-none ${isDisable ? 'text-gray-400' : 'text-gray-500'}`}>
                    Rp
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    name={name}
                    value={displayValue}
                    onChange={handleChange}
                    disabled={isDisable}
                    placeholder={placeholder}
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none transition-all duration-200
                        ${isDisable
                            ? "bg-[#F3F4F6] border-[#E2E8F0] text-[#45556C] cursor-not-allowed"
                            : error
                                ? "bg-white border-danger-500 focus:border-danger-500 focus:ring-1 focus:ring-danger-500"
                                : "bg-white border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-black"
                        }
                    `}
                />
            </div>
            {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
        </div>
    );
};

export default CurrencyInput;
