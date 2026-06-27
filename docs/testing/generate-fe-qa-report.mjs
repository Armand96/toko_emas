import ExcelJS from 'exceljs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════
// LAPORAN QA FRONTEND — Deep Test, Sesi 2026-06-27
// Generate: bun run generate-fe-qa-report.mjs
// ═══════════════════════════════════════════════════════════════

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Claude Code QA';
workbook.created = new Date();
workbook.modified = new Date();

const COLOR = {
    header: 'FF1F2937', headerFg: 'FFFFFFFF',
    pass: 'FF16A34A', passBg: 'FFDCFCE7',
    fail: 'FFDC2626', failBg: 'FFFEE2E2',
    skip: 'FFD97706', skipBg: 'FFFFFBEB',
    fixed: 'FF2563EB', fixedBg: 'FFEFF6FF',
    border: 'FFD1D5DB', stripe: 'FFF9FAFB',
    sectionBg: 'FFEEF2FF', sectionFg: 'FF1E40AF',
    title: 'FF111827',
};
const thinBorder = { style: 'thin', color: { argb: COLOR.border } };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function styleHeader(row) {
    row.height = 26;
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: COLOR.headerFg }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.header } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = allBorders;
    });
}
function severityStyle(s) {
    const v = (s || '').toUpperCase();
    if (v === 'BUG')        return { font: { bold: true, color: { argb: COLOR.fail }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.failBg } } };
    if (v === 'FIXED')      return { font: { bold: true, color: { argb: COLOR.fixed }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.fixedBg } } };
    if (v === 'PASS')       return { font: { bold: true, color: { argb: COLOR.pass }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.passBg } } };
    if (v === 'OK')         return { font: { bold: true, color: { argb: COLOR.pass }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.passBg } } };
    return {};
}
function applyRowStyle(row, idx) {
    row.eachCell((cell) => {
        cell.border = allBorders;
        cell.alignment = { vertical: 'top', wrapText: true };
        if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.stripe } };
    });
}
function addSectionRow(ws, colCount, title) {
    const row = ws.addRow([title]);
    ws.mergeCells(row.number, 1, row.number, colCount);
    const cell = row.getCell(1);
    cell.font = { bold: true, color: { argb: COLOR.sectionFg }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.sectionBg } };
    cell.alignment = { vertical: 'middle' };
    cell.border = allBorders;
    row.height = 22;
}

// ═══════════════════════════════════════════════════════════════
// SHEET 1 — TEMUAN & PERBAIKAN FE
// ═══════════════════════════════════════════════════════════════
const ws = workbook.addWorksheet('Temuan FE', { views: [{ state: 'frozen', ySplit: 4 }] });
ws.columns = [
    { width: 4 },   // No
    { width: 26 },  // Halaman
    { width: 46 },  // Bug
    { width: 30 },  // Lokasi (file:line)
    { width: 44 },  // Perbaikan
    { width: 10 },  // Status
];

const title = ws.addRow(['LAPORAN QA FRONTEND — Deep Test']);
ws.mergeCells(title.number, 1, title.number, 6);
title.getCell(1).font = { bold: true, size: 14, color: { argb: COLOR.title } };
title.height = 28;
const sub = ws.addRow(['Sesi: 2026-06-27  •  Metode: audit pola + build Vite  •  8 bug ditemukan & diperbaiki']);
ws.mergeCells(sub.number, 1, sub.number, 6);
sub.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };
ws.addRow([]);

const head = ws.addRow(['No', 'Halaman', 'Bug', 'Lokasi', 'Perbaikan', 'Status']);
styleHeader(head);

const rows = [
    { section: 'A. is_active integer-vs-boolean (toggle status)' },
    [1, 'Master Bank',
        'Edit bank yang Aktif tanpa menyentuh toggle → tersimpan jadi Tidak Aktif. is_active dari API (int 1) dibandingkan strict === true saat submit → selalu 0.',
        'MasterBank/Page.jsx:54,101',
        'Normalisasi is_active ke boolean saat buka modal; submit terima true/1/"1". Default add = true.', 'FIXED'],
    [2, 'User',
        'Sama: edit user tanpa ubah toggle berpotensi mengubah status. {...record} simpan is_active integer mentah.',
        'administrator/user/Page.jsx:84',
        'Normalisasi: { ...record, is_active: Boolean(Number(record.is_active)) }. Default add = true.', 'FIXED'],
    [3, 'Supplier',
        'Sama seperti User — tidak ada normalisasi is_active saat edit.',
        'administrator/Supplier/Page.jsx:57',
        'Normalisasi is_active ke boolean saat buka modal edit.', 'FIXED'],
    [4, 'Customer',
        'Sama seperti User — tidak ada normalisasi is_active saat edit.',
        'administrator/Customer/Page.jsx:59',
        'Normalisasi is_active ke boolean saat buka modal edit.', 'FIXED'],

    { section: 'B. Validasi tombol salah field (copy-paste leftover)' },
    [5, 'Master Bank (Modal)',
        'disableButton() cek formData.category_name (field tidak ada di form Bank) + judul modal masih "Kategori". Sisa copy-paste dari Master Kategori Finance.',
        'MasterBank/Modal.jsx:32,37',
        'Cek bank_code & bank_name; judul jadi "Bank/Edit Bank/Detail Bank".', 'FIXED'],
    [6, 'Store / Setting (Modal)',
        'disableButton() cek formData.nama_toko padahal field bernama shop_name → validasi nama toko tidak pernah jalan.',
        'administrator/Store/Modal.jsx:47',
        'Ganti cek ke formData.shop_name.', 'FIXED'],
    [7, 'Cabang / Branch (Modal)',
        'disableButton() cek formData.open_date padahal field bernama branch_open_date → tombol Simpan stuck disabled walau form lengkap.',
        'administrator/Branch/Modal.jsx:121',
        'Ganti cek ke formData.branch_open_date.', 'FIXED'],

    { section: 'C. Pagination & Enum' },
    [8, 'Master Produk',
        'Table dikirim prop currentPage/pageSize, padahal Table butuh prop "page"; nilai paramFetch.page/pageSize juga tidak ada (yang benar current_page/per_page) → pagination rusak.',
        'Inventory/MasterProduk/Page.jsx:344-345',
        'Ganti ke page={paramFetch.current_page} pageSize={paramFetch.per_page}.', 'FIXED'],
    [9, 'Report Penjualan',
        'Badge pembayaran cek type === "CASH" || "Tunai". Enum BE = TUNAI/TRANSFER (uppercase). "CASH" dead code, "Tunai" tidak match.',
        'Report/Penjualan/Page.jsx:206',
        'Ganti jadi type === "TUNAI".', 'FIXED'],
];

let idx = 0;
for (const r of rows) {
    if (r.section) { addSectionRow(ws, 6, r.section); continue; }
    const row = ws.addRow(r);
    applyRowStyle(row, idx++);
    const st = severityStyle(r[5]);
    const cell = row.getCell(6);
    if (st.font) cell.font = st.font;
    if (st.fill) cell.fill = st.fill;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

// ═══════════════════════════════════════════════════════════════
// SHEET 2 — AREA DIPERIKSA, TIDAK BERMASALAH
// ═══════════════════════════════════════════════════════════════
const ws2 = workbook.addWorksheet('Diperiksa - OK', { views: [{ state: 'frozen', ySplit: 2 }] });
ws2.columns = [{ width: 4 }, { width: 34 }, { width: 60 }, { width: 10 }];
const t2 = ws2.addRow(['AREA DIPERIKSA — TIDAK ADA MASALAH']);
ws2.mergeCells(t2.number, 1, t2.number, 4);
t2.getCell(1).font = { bold: true, size: 13, color: { argb: COLOR.title } };
t2.height = 26;
const h2 = ws2.addRow(['No', 'Area', 'Catatan', 'Status']);
styleHeader(h2);
const okRows = [
    [1, 'Master Kategori Finance', 'is_active dinormalisasi saat edit (record.is_active === 1) & submit konsisten. Tidak ada bug.', 'OK'],
    [2, 'Cabang — is_active', 'Page.jsx:87 sudah normalisasi is_active ke boolean. Hanya disableButton yang salah field (sudah difix).', 'OK'],
    [3, 'Komponen StatusToggle / Checkbox', 'Keduanya emit boolean asli via onChange({target:{value:boolean}}). Wrapper benar.', 'OK'],
    [4, 'Image path di tabel/card', 'Tidak ditemukan kesalahan .image_path vs .product.image_path pada kode aktif.', 'OK'],
    [5, 'Build Vite (bun run build)', 'Build sukses tanpa error setelah semua perbaikan. Hanya warning ukuran chunk (pre-existing).', 'PASS'],
];
let i2 = 0;
for (const r of okRows) {
    const row = ws2.addRow(r);
    applyRowStyle(row, i2++);
    const st = severityStyle(r[3]);
    const cell = row.getCell(4);
    if (st.font) cell.font = st.font;
    if (st.fill) cell.fill = st.fill;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

const outPath = path.resolve('FE_QA_REPORT.xlsx');
await workbook.xlsx.writeFile(outPath);
console.log('✅ Report tersimpan: ' + outPath);
