import { QRCodeCanvas } from "qrcode.react";

const GenerateQR = ({ value, size = 64, showText = true, textSize = "7px" }) => {
    if (!value) return null;

    return (
        <div className="flex flex-col items-center gap-1">
            <QRCodeCanvas value={value} size={size} level="M" marginSize={1} />
            {showText && (
                <span className="text-gray-500 font-medium" style={{ fontSize: textSize }}>
                    {value}
                </span>
            )}
        </div>
    );
};

export default GenerateQR;
