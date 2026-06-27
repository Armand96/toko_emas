import { X as XIcon, Image as ImageIcon } from "@phosphor-icons/react";
import CodeBadge from "./CodeBadge";
import HelperFunctions from "../utils/HelperFunctions";

const InventoryItemCard = ({
    code,
    name,
    specs,
    image,
    price,
    codeBadgeVariant = "default",
    onRemove,
}) => {
    return (
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3">
                <CodeBadge variant={codeBadgeVariant}>{code}</CodeBadge>
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
                    {specs && (
                        <span className="text-xs text-gray-500 mt-0.5">{specs}</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
                {price !== undefined && price !== null && (
                    <span className="text-sm font-bold text-gray-900">
                        {HelperFunctions.formatCurrency(price)}
                    </span>
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
