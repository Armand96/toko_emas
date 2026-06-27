import { Info, InfoIcon, MagnifyingGlassIcon, WarningCircle, WarningCircleIcon } from "@phosphor-icons/react";


const spanClasses = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
};

const DesktopSpanClasses = {
    1: 'lg:col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    7: 'lg:col-span-7',
    8: 'lg:col-span-8',
};

const SearchInput = ({
    label,
    type = "text",
    name,
    value,
    placeholder,
    isDisable,
    isRequired,
    error,
    colSpan = '1',
    deskSpan = colSpan,
    onChange,
}) => {
    return (
        <div className={`flex flex-col gap-1 w-full ${spanClasses[colSpan] ? `${spanClasses[colSpan]}` : ''} ${DesktopSpanClasses[deskSpan] ? DesktopSpanClasses[deskSpan] : ''}`}>
            {label && (
                <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    {label}
                    {isRequired && <span className="text-danger-500">*</span>}
                </label>
            )}
            <div className="relative flex items-center">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type={type}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    disabled={isDisable}
                    placeholder={placeholder}
                    className={`w-full pl-10 px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all duration-200
            ${isDisable
                            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                            : error
                                ? "border-danger-500 focus:border-danger-500 focus:ring-1 focus:ring-danger-500"
                                : "border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-black"
                        }
          `}
                />
                {/* {error && (
                    <WarningCircleIcon
                        size={18}
                        className="absolute right-3 text-danger-500"
                    />
                )} */}
            </div>
            {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
        </div>
    );
};

export default SearchInput;
