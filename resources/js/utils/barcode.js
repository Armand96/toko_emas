/**
 * Generate nilai barcode unik (format CODE128-friendly).
 * Contoh hasil: "CIN-481523-001"
 *
 * @param {string} prefix - prefix barcode (mis. 3 huruf awal nama produk)
 * @param {number} seq    - urutan item dalam batch (mulai 0)
 */
export const generateBarcode = (prefix = "ITM", seq = 0) => {
    const clean =
        (prefix || "ITM")
            .replace(/[^A-Za-z0-9]/g, "")
            .toUpperCase()
            .slice(0, 3) || "ITM";

    const ts = Date.now().toString().slice(-6);      // 6 digit terakhir timestamp
    const seqStr = String(seq + 1).padStart(3, "0"); // 001, 002, ...

    return `${clean}-${ts}-${seqStr}`;
};

export default generateBarcode;
