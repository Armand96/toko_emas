/**
 * Generate nilai barcode unik untuk item pembelian berdasarkan kode produk master.
 * Contoh hasil: "GLD0100000-001"
 *
 * @param {string} productBarcode - kode produk dari master produk
 * @param {number} seq            - urutan item dengan kode produk yang sama (mulai 0)
 */
export const generateBarcode = (productBarcode = "ITM", seq = 0) => {
    const base = (productBarcode || "ITM").trim().toUpperCase() || "ITM";
    const seqStr = String(seq + 1).padStart(3, "0"); // 001, 002, ...

    return `${base}-${seqStr}`;
};

export default generateBarcode;
