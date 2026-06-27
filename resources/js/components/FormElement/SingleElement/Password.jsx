import React, { useState } from "react";
import { WarningCircleIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

const InputPassword = ({
    label,
    name,
    value,
    placeholder,
    isDisable,
    isRequired,
    error,
    onChange,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    {label}
                    {isRequired && <span className="text-danger-500">*</span>}
                </label>
            )}
            <div className="relative flex items-center">
                <input
                    type={showPassword ? "text" : "password"}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    disabled={isDisable}
                    placeholder={placeholder}
                    className={`w-full pl-3 pr-10 py-2 text-sm bg-white border rounded-lg outline-none transition-all duration-200
                        ${isDisable
                            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                            : error
                                ? "border-danger-500 focus:border-danger-500 focus:ring-1 focus:ring-danger-500"
                                : "border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-black"
                        }
                    `}
                />

                <div className="absolute right-3 flex items-center gap-1.5 dynamic-icons">
                    {error && (
                        <WarningCircleIcon
                            size={18}
                            className="text-danger-500"
                        />
                    )}
                    {!isDisable && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer flex items-center justify-center"
                        >
                            {showPassword ? (
                                <EyeSlashIcon size={18} />
                            ) : (
                                <EyeIcon size={18} />
                            )}
                        </button>
                    )}
                </div>
            </div>
            {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
        </div>
    );
};

export default InputPassword;
