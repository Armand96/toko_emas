import ExcelJS from 'exceljs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════
// LAPORAN PERUBAHAN BACKEND — Sesi 2026-06-27
// Generate: bun run generate-be-changes-report.mjs
// ═══════════════════════════════════════════════════════════════

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Claude Code';
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

function statusStyle(status) {
    const s = (status || '').toUpperCase();
    if (s === 'FIXED')  return { font: { bold: true, color: { argb: COLOR.fixed }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.fixedBg } } };
    if (s === 'PASS')   return { font: { bold: true, color: { argb: COLOR.pass }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.passBg } } };
    if (s === 'SKIP')   return { font: { bold: true, color: { argb: COLOR.skip }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.skipBg } } };
    return {};
}

function applyRowStyle(row, idx) {
    row.eachCell((cell) => {
        cell.border = allBorders;
        cell.alignment = { vertical: 'top', wrapText: true };
        if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.stripe } };
        }
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
// SHEET 1 — RINGKASAN PERUBAHAN BE
// ═══════════════════════════════════════════════════════════════
const ws = workbook.addWorksheet('Perubahan BE', {
    views: [{ state: 'frozen', ySplit: 4 }],
});

ws.columns = [
    { width: 4 },   // No
    { width: 30 },  // Item
    { width: 42 },  // Masalah / Tujuan
    { width: 46 },  // Solusi
    { width: 38 },  // File
    { width: 11 },  // Status
];

// Title
const title = ws.addRow(['LAPORAN PERUBAHAN BACKEND — Toko Emas']);
ws.mergeCells(title.number, 1, title.number, 6);
title.getCell(1).font = { bold: true, size: 14, color: { argb: COLOR.title } };
title.getCell(1).alignment = { vertical: 'middle' };
title.height = 28;

const sub = ws.addRow(['Sesi: 2026-06-27  •  Lingkup: Backend (Laravel) + sebagian FE pendukung']);
ws.mergeCells(sub.number, 1, sub.number, 6);
sub.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };
ws.addRow([]);

const head = ws.addRow(['No', 'Item', 'Masalah / Tujuan', 'Solusi yang Diterapkan', 'File', 'Status']);
styleHeader(head);

const rows = [
    // [section] atau [no, item, masalah, solusi, file, status]
    { section: 'A. FILTER AGING — REPORT INVENTORY' },
    [1, 'Filter Aging tidak berfungsi',
        'inventoryDetail() belum membaca param `aging`, sehingga dropdown aging di Report Inventory tidak memfilter data.',
        'Tambah handler param `aging` (0-30 / 31-90 / 91-180 / >180) memakai DATEDIFF(NOW(), created_at), range konsisten dengan grouping KPI aging.',
        'app/Http/Controllers/InventoryReportController.php', 'FIXED'],

    { section: 'B. CATATAN HILANG SETELAH APPROVE / BATALKAN' },
    [2, 'Catatan pengajuan tertimpa (Transfer)',
        'changeApproval() menimpa kolom `note` (catatan pengajuan) dengan note approval / null saat approve/tolak/batalkan → catatan asli jadi kosong.',
        'Tambah kolom terpisah `note_approval`. Alasan approval disimpan ke `note_approval`, `note` pengajuan tidak diubah lagi.',
        'app/Http/Controllers/TransferItemController.php', 'FIXED'],
    [3, 'Alasan tolak/batal tidak tersimpan (Remove)',
        'Pada changeApproval() Remove Item, baris penyimpanan note di-comment, alasan tolak/batal hilang.',
        'Simpan alasan ke kolom baru `note_approval` (bukan menimpa `note` pengajuan).',
        'app/Http/Controllers/RemoveItemController.php', 'FIXED'],
    [4, 'Kolom note_approval (migration)',
        'Belum ada tempat menyimpan alasan approval terpisah dari catatan pengajuan.',
        'Migration baru: tambah kolom `note_approval` (nullable) di tabel remove_items & transfer_items. Sudah di-migrate.',
        'database/migrations/2026_06_27_000000_add_note_approval_to_remove_and_transfer_items.php', 'FIXED'],
    [5, 'Fillable model',
        'Model belum mengizinkan mass-assign note_approval.',
        'Tambah `note_approval` ke $fillable RemoveItem & TransferItem.',
        'app/Models/RemoveItem.php, app/Models/TransferItem.php', 'FIXED'],
    [6, 'FE membaca note_approval',
        'Modal Remove Item membaca `note` untuk alasan tolak (konflik dgn catatan pengajuan).',
        'Modal approval Remove Item kini membaca `note_approval` untuk alasan tolak/batal.',
        'resources/js/pages/Approval/ApprovalRemoveItem/Modal.jsx', 'FIXED'],

    { section: 'C. LOCK TRANSAKSI FINANCE OTOMATIS' },
    [7, 'Transaksi otomatis bisa diedit/dihapus',
        'Finance hasil approval pembelian (CASH OUT) & cetak kwitansi penjualan (CASH IN) bisa diubah/dihapus manual → saldo tidak konsisten.',
        'Tambah flag `is_auto` (boolean, default false) + cast boolean. Migration sudah di-migrate.',
        'database/migrations/2026_06_27_000001_add_is_auto_to_finances_table.php, app/Models/Finance.php', 'FIXED'],
    [8, 'Tandai transaksi auto saat dibuat',
        'Finance otomatis harus ditandai is_auto=true di sumbernya.',
        'Set `is_auto => true` di Finance::create() pada PembelianController (CASH OUT) & TSalesController (CASH IN).',
        'app/Http/Controllers/PembelianController.php, app/Http/Controllers/TSalesController.php', 'FIXED'],
    [9, 'Guard update & destroy',
        'BE harus menolak edit/hapus transaksi auto.',
        'update() & destroy() return 422 bila is_auto=true (pesan: tidak dapat diubah/dihapus). Diverifikasi: 422 + record tidak terhapus.',
        'app/Http/Controllers/FinanceController.php', 'FIXED'],
    [10, 'FE sembunyikan tombol edit/hapus',
        'Tombol edit/hapus tetap muncul untuk transaksi auto → user dapat 422.',
        'Tombol edit & delete di-hide saat row.is_auto = true.',
        'resources/js/pages/Finance/Page.jsx', 'FIXED'],

    { section: 'D. TIDAK DIUBAH (SENGAJA) — sudah benar / di luar lingkup BE' },
    [11, 'Modal Bank is_active jadi aktif',
        'QA: status inactive jadi active setelah simpan.',
        'BE sudah benar: rule `required|boolean`, fillable, update($validated). Akar masalah di FormData FE (kirim string). Tidak diubah di BE.',
        'app/Http/Controllers/MBankController.php', 'SKIP'],
    [12, 'Stock Opname TRANSIT → EXTRA',
        'QA: item TRANSIT kena EXTRA saat scan.',
        'Klasifikasi INSTOCK/EXTRA/MISSING dihitung di FE; BE hanya hitung total AVAILABLE. Bukan fix BE yang bersih, ditahan.',
        'app/Http/Controllers/StockOpnameHeaderController.php', 'SKIP'],
];

let dataIdx = 0;
for (const r of rows) {
    if (r.section) {
        addSectionRow(ws, 6, r.section);
        continue;
    }
    const row = ws.addRow(r);
    applyRowStyle(row, dataIdx++);
    const st = statusStyle(r[5]);
    const cell = row.getCell(6);
    if (st.font) cell.font = st.font;
    if (st.fill) cell.fill = st.fill;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

// ═══════════════════════════════════════════════════════════════
// SHEET 2 — HASIL VERIFIKASI (TEST)
// ═══════════════════════════════════════════════════════════════
const ws2 = workbook.addWorksheet('Verifikasi', {
    views: [{ state: 'frozen', ySplit: 2 }],
});
ws2.columns = [
    { width: 4 }, { width: 36 }, { width: 52 }, { width: 12 },
];

const t2 = ws2.addRow(['HASIL VERIFIKASI — Skenario & Pengecekan Langsung']);
ws2.mergeCells(t2.number, 1, t2.number, 4);
t2.getCell(1).font = { bold: true, size: 13, color: { argb: COLOR.title } };
t2.height = 26;

const h2 = ws2.addRow(['No', 'Pengecekan', 'Hasil', 'Status']);
styleHeader(h2);

const checks = [
    [1, 'run-full-scenario.mjs', 'Pembelian 69 disetujui, Inventory AVAILABLE/SOLD, 12 kwitansi, Saldo akhir Rp 378.031.264, Finance summary balance. Semua skenario berhasil.', 'PASS'],
    [2, 'run-inventory-scenario.mjs', 'Transfer approve/cancel, Remove HILANG→LOST, REPAIR→RETURN→AVAILABLE, tolak→AVAILABLE, Stock Opname SESUAI. Semua skenario berhasil.', 'PASS'],
    [3, 'Finance is_auto populated', 'Auto = 44, Manual = 61. Setiap kwitansi & approval pembelian ditandai is_auto=true.', 'PASS'],
    [4, 'note_approval terpisah dari note', 'Remove: note="Dilaporkan hilang oleh kasir." TETAP, note_approval="Item ditemukan kembali...". Tidak saling timpa.', 'PASS'],
    [5, 'Filter aging 0-30', 'Detail aging=0-30 → 69 baris, semua aging_days=0. aging=>180 → 0 baris. Filter berfungsi.', 'PASS'],
    [6, 'Guard Finance lock (update/destroy)', 'destroy(auto) → HTTP 422, update(auto) → HTTP 422, record auto TIDAK terhapus.', 'PASS'],
];
let i2 = 0;
for (const c of checks) {
    const row = ws2.addRow(c);
    applyRowStyle(row, i2++);
    const st = statusStyle(c[3]);
    const cell = row.getCell(4);
    if (st.font) cell.font = st.font;
    if (st.fill) cell.fill = st.fill;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

// ═══════════════════════════════════════════════════════════════
const outPath = path.resolve('BE_CHANGES_REPORT.xlsx');
await workbook.xlsx.writeFile(outPath);
console.log('✅ Report tersimpan: ' + outPath);
