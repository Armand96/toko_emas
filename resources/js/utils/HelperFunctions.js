import { generateBarcode } from "./barcode";
import InventoryApis from "../Services/Inventory.apis";
import OptionsStore from "../Store/OptionsStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.example.com";

const HelperFunctions = {
    generateBarcode,
    getStorageUrl: (path) => {
        if (!path) return null;
        return `${BASE_URL.replace(/\/$/, '')}/storage/${path}`;
    },
    /**
     * Buka tab baru ke halaman cetak barcode.
     * Dipakai di Pembelian (batch baru) & Item Inventory (item existing).
     *
     * @param {string|string[]} barcodes - satu barcode atau array barcode
     * @param {object} [extra] - data tambahan per barcode untuk ditampilkan (mis. { label, produk })
     */
    printBarcode: (barcodes, extra = {}) => {
        const list = Array.isArray(barcodes) ? barcodes : [barcodes];
        const items = extra.items || null;
        const payload = { barcodes: list, extra, items };
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
    formatDropdownBank: (data = [], valueKey = 'id', isNull = false) => {
        if (!Array.isArray(data)) return [];
        let formattedData = data.map(item => ({
            value: item[valueKey],
            label: `${item.bank?.bank_name ?? '-'} - ${item.nomor_rekening ?? '-'} - ${item.nama_pemilik ?? '-'}`,
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
    },
    /**
     * Endpoint sales detail (api/sales/{id}) tidak eager-load relasi
     * details.product & details.inventory, sehingga product_name/thumb_path
     * kosong. Lengkapi data tersebut dari api/products & api/inventory.
     */
    enrichSalesDetails: async (details = []) => {
        if (!Array.isArray(details) || details.length === 0) return details;

        try {
            const products = await OptionsStore.getState().ensureProducts();

            const codes = details
                .filter(item => !item.inventory && item.inventory_code)
                .map(item => item.inventory_code);

            const inventoryMap = {};
            if (codes.length > 0) {
                const results = await Promise.all(
                    codes.map(code => InventoryApis.GetInventory(`?inventory_code=${encodeURIComponent(code)}`))
                );
                results.forEach(res => {
                    const inv = res?.data?.[0];
                    if (inv) inventoryMap[inv.inventory_code] = inv;
                });
            }

            return details.map((item) => {
                const product = item.product || products.find((p) => p.id === item.product_id);
                const inventory = item.inventory || inventoryMap[item.inventory_code];

                return { ...item, product, inventory };
            });
        } catch (error) {
            console.error(error);
            return details;
        }
    },
  formatOnlyNumber: (value) => {
    if (typeof value === 'string') {
      return value.replace(/\D/g, '');
    }
    return value;
  }
};

export default HelperFunctions;
