// Kompres gambar via canvas (tanpa dependency). Mengecilkan dimensi
// bila melebihi maxDimension lalu re-encode ke JPEG dengan quality menurun
// sampai ukuran <= maxSizeMB. Mengembalikan File baru (atau file asli bila
// bukan gambar / sudah cukup kecil / gagal dikompres).

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

const canvasToBlob = (canvas, quality) =>
    new Promise((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality)
    );

export const compressImage = async (
    file,
    { maxSizeMB = 3, maxDimension = 1920, quality = 0.8 } = {}
) => {
    if (!file || !file.type?.startsWith("image/")) return file;

    const maxBytes = maxSizeMB * 1024 * 1024;
    // Sudah cukup kecil & bukan format yang perlu re-encode → biarkan.
    if (file.size <= maxBytes) return file;

    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadImage(objectUrl);

        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
            const scale = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let q = quality;
        let blob = await canvasToBlob(canvas, q);
        // Turunkan quality bertahap sampai muat.
        while (blob && blob.size > maxBytes && q > 0.4) {
            q -= 0.1;
            blob = await canvasToBlob(canvas, q);
        }

        if (!blob) return file;

        const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
        return new File([blob], newName, {
            type: "image/jpeg",
            lastModified: Date.now(),
        });
    } catch {
        // Kalau gagal (mis. gambar corrupt), kembalikan file asli.
        return file;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

export default compressImage;
