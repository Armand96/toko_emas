import { X as XIcon, Image as ImageIcon } from "@phosphor-icons/react";
import CodeBadge from "./CodeBadge";
import HelperFunctions from "../utils/HelperFunctions";

const InventoryItemCard = ({
    code,
    name,
    specs,
    image,
    price,
    editablePrice = false,
    onPriceChange,
    codeBadgeVariant = "default",
    onRemove,
}) => {
    return (
        <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* <CodeBadge variant={codeBadgeVariant} className="hidden sm:inline-flex">{code}</CodeBadge> */}
                <div className="w-10 h-10 rounded-md bg-amber-100/50 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                    {image ? (
                        <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <ImageIcon size={20} weight="fill" className="text-amber-400" />
                    )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-900 truncate">{name || '-'}</span>
                    <span className="text-[11px] text-gray-400 font-mono truncate sm:hidden">{code}</span>
                    {specs && (
                        <span className="text-xs text-gray-500 mt-0.5">{specs}</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {editablePrice ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 whitespace-nowrap">Harga Jual :</span>
                        <div className="relative flex items-center">
                            <span className="absolute left-2 text-xs font-medium text-gray-500 select-none">Rp</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={price ? HelperFunctions.formatNumberInput(price) : ''}
                                onChange={(e) => onPriceChange?.(HelperFunctions.unformatNumberInput(e.target.value))}
                                placeholder="0"
                                className="w-32 pl-7 pr-2 py-1.5 text-sm font-bold text-gray-900 border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                ) : (
                    price !== undefined && price !== null && (
                        <span className="text-sm font-bold text-gray-900">
                            {HelperFunctions.formatCurrency(price)}
                        </span>
                    )
                )}
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                        <XIcon size={16} weight="bold" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default InventoryItemCard;
