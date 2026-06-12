import { generateBarcode } from "./barcode";

const HelperFunctions = {
    generateBarcode,
    /**
     * Buka tab baru ke halaman cetak barcode.
     * Dipakai di Pembelian (batch baru) & Item Inventory (item existing).
     *
     * @param {string|string[]} barcodes - satu barcode atau array barcode
     * @param {object} [extra] - data tambahan per barcode untuk ditampilkan (mis. { label, produk })
     */
    printBarcode: (barcodes, extra = {}) => {
        const list = Array.isArray(barcodes) ? barcodes : [barcodes];
        const payload = { barcodes: list, extra };
        sessionStorage.setItem("print_barcode_data", JSON.stringify(payload));
        window.open("/inventory/print-barcode", "_blank");
    },
    formatDropdown: (data = [], valueKey = 'id', labelKey = 'name', isNull = false) => {
        if (!Array.isArray(data)) return [];
        let formattedData = data.map(item => ({
            value: item[valueKey],
            label: item[labelKey],
            details: item,
        }));
        if (isNull) {
            formattedData = [{ value: '', label: 'Pilih' }, ...formattedData];
        }
        return formattedData;
    },
    formatDropdownWithCode: (data = [], valueKey = 'id', labelCode = 'code', labelKey = 'name', isNull = false) => {
        if (!Array.isArray(data)) return [];
        let formattedData = data.map(item => ({
            value: item[valueKey],
            label: `${item[labelCode]} - ${item[labelKey]}`,
            details: item,
        }));
        if (isNull) {
            formattedData = [{ value: '', label: 'Pilih' }, ...formattedData];
        }
        return formattedData;
    },
    formatCurrency: (price) => {
         return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price);
    },
    formatNumberInput: (value) => {
        const numeric = String(value ?? '').replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('id-ID').format(Number(numeric));
    },
    unformatNumberInput: (value) => {
        return String(value ?? '').replace(/\D/g, '');
    }
};

export default HelperFunctions;
