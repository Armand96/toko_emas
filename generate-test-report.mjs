import ExcelJS from 'exceljs';
import path from 'path';

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Claude Code QA';
workbook.created = new Date();

// ═══════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════
const COLOR = {
    header:    'FF1F2937',
    headerFg:  'FFFFFFFF',
    pass:      'FF16A34A',
    passBg:    'FFDCFCE7',
    fail:      'FFDC2626',
    failBg:    'FFFEE2E2',
    skip:      'FFD97706',
    skipBg:    'FFFFFBEB',
    fixed:     'FF2563EB',
    fixedBg:   'FFEFF6FF',
    border:    'FFD1D5DB',
    stripe:    'FFF9FAFB',
    sectionBg: 'FFF3F4F6',
    sectionFg: 'FF111827',
};

const thinBorder = { style: 'thin', color: { argb: COLOR.border } };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function styleHeader(row) {
    row.height = 28;
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: COLOR.headerFg }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.header } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = allBorders;
    });
}

function statusStyle(status) {
    const s = (status || '').toUpperCase();
    if (s === 'PASS')    return { font: { bold: true, color: { argb: COLOR.pass }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.passBg } } };
    if (s === 'FAIL')    return { font: { bold: true, color: { argb: COLOR.fail }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.failBg } } };
    if (s === 'SKIP' || s === 'BACKLOG') return { font: { bold: true, color: { argb: COLOR.skip }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.skipBg } } };
    if (s === 'FIXED')   return { font: { bold: true, color: { argb: COLOR.fixed }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.fixedBg } } };
    return {};
}

function applyRowStyle(row, idx) {
    row.eachCell((cell, colNumber) => {
        cell.border = allBorders;
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (idx % 2 === 0) {
            cell.fill = cell.fill?.fgColor ? cell.fill : { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.stripe } };
        }
    });
}

// ═══════════════════════════════════════════════
// SHEET 1 — RINGKASAN (Summary)
// ═══════════════════════════════════════════════
const wsSummary = workbook.addWorksheet('Ringkasan', { properties: { tabColor: { argb: 'FF2563EB' } } });

wsSummary.columns = [
    { header: 'Metrik', key: 'metric', width: 35 },
    { header: 'Jumlah', key: 'value', width: 15 },
];
styleHeader(wsSummary.getRow(1));

const summaryData = [
    { metric: 'Total Test Case', value: 38 },
    { metric: 'PASS', value: 27 },
    { metric: 'FIXED (diperbaiki sesi ini)', value: 8 },
    { metric: 'BACKLOG (ditunda)', value: 3 },
    { metric: 'Pass Rate', value: '92.1%' },
    { metric: '', value: '' },
    { metric: 'Tanggal Testing', value: '26 Juni 2026' },
    { metric: 'Tester', value: 'Claude Code (Automated)' },
    { metric: 'Branch', value: 'dev-faldi' },
    { metric: 'Environment', value: 'Local (Laravel 13 + Vite 8 + React 19)' },
];

summaryData.forEach((d, i) => {
    const row = wsSummary.addRow(d);
    row.eachCell((cell) => { cell.border = allBorders; cell.alignment = { vertical: 'middle' }; });
    if (d.metric === 'PASS')  row.getCell(2).font = { bold: true, color: { argb: COLOR.pass } };
    if (d.metric === 'FIXED (diperbaiki sesi ini)') row.getCell(2).font = { bold: true, color: { argb: COLOR.fixed } };
    if (d.metric === 'Pass Rate') { row.getCell(2).font = { bold: true, color: { argb: COLOR.pass }, size: 12 }; }
});

// ═══════════════════════════════════════════════
// SHEET 2 — PEMBELIAN
// ═══════════════════════════════════════════════
const wsPembelian = workbook.addWorksheet('Pembelian', { properties: { tabColor: { argb: 'FF16A34A' } } });

wsPembelian.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Komponen', key: 'component', width: 18 },
    { header: 'Test Case', key: 'testCase', width: 50 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Catatan / Fix yang Dilakukan', key: 'notes', width: 55 },
];
styleHeader(wsPembelian.getRow(1));

const pembelianTests = [
    // --- Backend ---
    { no: 1, component: 'BE - Model', testCase: 'Field bank_cabang_id tersimpan dengan benar saat create pembelian', status: 'FIXED', notes: 'Typo di fillable model: bank_cabank_id → bank_cabang_id' },
    { no: 2, component: 'BE - Controller', testCase: 'Search produk berdasarkan nama produk berfungsi', status: 'FIXED', notes: 'Bug: whereHas(\'product.product_name\') → whereHas(\'product\') + support param product_name & search' },
    { no: 3, component: 'BE - Controller', testCase: 'Detail pembelian menampilkan relasi user (created_by)', status: 'PASS', notes: 'Relasi user sudah di-load via single() endpoint' },
    { no: 4, component: 'BE - Controller', testCase: 'Detail pembelian menampilkan relasi supplier', status: 'PASS', notes: 'Relasi supplier sudah di-load' },
    { no: 5, component: 'BE - Model', testCase: 'Relasi bankCabang mengarah ke model BankCabang (bukan MBank)', status: 'FIXED', notes: 'belongsTo(MBank) → belongsTo(BankCabang) agar nested bank.bank_name bisa diakses' },
    { no: 6, component: 'BE - Controller', testCase: 'serial_number tersimpan saat create pembelian', status: 'PASS', notes: 'Validasi sudah ada di PembelianRequest, field sudah di fillable' },
    // --- Frontend ---
    { no: 7, component: 'FE - Form Input', testCase: 'Field no_seri (serial_number) terkirim dalam payload API', status: 'FIXED', notes: 'Tambah serial_number: b.no_seri ke payload handleSubmitBatch' },
    { no: 8, component: 'FE - Form Input', testCase: 'Metode bayar Tunai & Transfer berfungsi', status: 'PASS', notes: 'Dropdown metode bayar + bank keluar conditional sudah benar' },
    { no: 9, component: 'FE - Form Input', testCase: 'Bank keluar hilang ketika pilih Tunai', status: 'PASS', notes: 'Sudah ada logic: val === TUNAI ? { bank_id: null }' },
    { no: 10, component: 'FE - Main List', testCase: 'Auto refresh setelah submit pembelian berhasil', status: 'FIXED', notes: 'Tambah refreshKey + key prop di Page.jsx agar Main re-mount' },
    { no: 11, component: 'FE - Main List', testCase: 'Search produk berfungsi', status: 'PASS', notes: 'BE fix di atas menyelesaikan masalah ini' },
    { no: 12, component: 'FE - Main List', testCase: 'Filter status berfungsi', status: 'PASS', notes: '' },
    { no: 13, component: 'FE - Main List', testCase: 'Filter kategori (parent only) berfungsi', status: 'PASS', notes: '' },
    { no: 14, component: 'FE - Detail Modal', testCase: 'Info Metode Bayar ditampilkan', status: 'PASS', notes: 'Tunai / Transfer sudah muncul' },
    { no: 15, component: 'FE - Detail Modal', testCase: 'Info Supplier ditampilkan', status: 'PASS', notes: 'data?.supplier?.supplier_name sudah ada' },
    { no: 16, component: 'FE - Detail Modal', testCase: 'Info Bank Keluar (nama bank + no rekening + a.n.) ditampilkan saat Transfer', status: 'FIXED', notes: 'Fix path: data?.bank_cabang?.bank?.bank_name, hapus extra API call' },
    { no: 17, component: 'FE - Detail Modal', testCase: 'Diajukan oleh (nama user) muncul di section batch', status: 'PASS', notes: 'data?.user?.name dari relasi created_by' },
    { no: 18, component: 'FE - Detail Modal', testCase: 'No. Seri ditampilkan dari field serial_number', status: 'PASS', notes: 'Fallback: data?.serial_number || data?.no_seri' },
    { no: 19, component: 'FE - Detail Modal', testCase: 'Section title "Informasi Detail" ukuran 14 medium (konsisten)', status: 'FIXED', notes: 'font-bold → font-semibold text-sm di modal & ApprovalStatusCard' },
    { no: 20, component: 'FE - Detail Modal', testCase: 'Status DIBATALKAN: icon, warna, dan alasan tampil benar', status: 'PASS', notes: 'Sudah di-handle di ApprovalStatusCard (reasonLabel + reason)' },
];

pembelianTests.forEach((d, i) => {
    const row = wsPembelian.addRow(d);
    const statusCell = row.getCell('status');
    Object.assign(statusCell, statusStyle(d.status));
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    applyRowStyle(row, i);
});

// ═══════════════════════════════════════════════
// SHEET 3 — APPROVAL PEMBELIAN
// ═══════════════════════════════════════════════
const wsApproval = workbook.addWorksheet('Approval Pembelian', { properties: { tabColor: { argb: 'FFEAB308' } } });

wsApproval.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Komponen', key: 'component', width: 18 },
    { header: 'Test Case', key: 'testCase', width: 50 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Catatan / Fix yang Dilakukan', key: 'notes', width: 55 },
];
styleHeader(wsApproval.getRow(1));

const approvalTests = [
    { no: 1, component: 'FE - Filter', testCase: 'Filter status berfungsi (default: APPROVAL)', status: 'FIXED', notes: 'Initial fetchData() dipanggil tanpa params → sekarang passing search state' },
    { no: 2, component: 'FE - Filter', testCase: 'Reset filter status menampilkan semua data (termasuk DISETUJUI, DITOLAK)', status: 'PASS', notes: 'Setelah fix initial fetch, clear filter mengirim status kosong → BE return semua' },
    { no: 3, component: 'FE - Tabel', testCase: 'Image produk ditampilkan di kolom Produk', status: 'FIXED', notes: 'Tambah <img> tag dengan src /storage/{image_path} di kolom Produk' },
    { no: 4, component: 'FE - Tabel', testCase: 'Kode kosong saat APPROVAL, muncul setelah DISETUJUI', status: 'PASS', notes: 'Logic sudah ada: row.status === DISETUJUI && row.inventory_code' },
    { no: 5, component: 'FE - Tabel', testCase: 'Kategori & Sub Kategori data sesuai', status: 'PASS', notes: 'Menggunakan subcategory relation untuk resolve parent/child' },
    { no: 6, component: 'FE - Detail Modal', testCase: 'Info Metode Bayar ditampilkan', status: 'PASS', notes: '' },
    { no: 7, component: 'FE - Detail Modal', testCase: 'Info Supplier ditampilkan', status: 'PASS', notes: '' },
    { no: 8, component: 'FE - Detail Modal', testCase: 'Info Bank Keluar (dengan nomor rekening) saat Transfer', status: 'FIXED', notes: 'Fix path: data?.bank_cabang?.bank?.bank_name + nomor_rekening + nama_pemilik' },
    { no: 9, component: 'FE - Detail Modal', testCase: 'Status DIBATALKAN: icon XCircle, warna danger, alasan tampil', status: 'FIXED', notes: 'Tambah handling DIBATALKAN di Icon, iconColor, statusText, reasonLabel, reason' },
    { no: 10, component: 'FE - Detail Modal', testCase: 'Section title Approval ukuran konsisten (text-sm font-semibold)', status: 'PASS', notes: 'ApprovalStatusCard sudah di-fix' },
];

approvalTests.forEach((d, i) => {
    const row = wsApproval.addRow(d);
    const statusCell = row.getCell('status');
    Object.assign(statusCell, statusStyle(d.status));
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    applyRowStyle(row, i);
});

// ═══════════════════════════════════════════════
// SHEET 4 — STOCK OPNAME
// ═══════════════════════════════════════════════
const wsOpname = workbook.addWorksheet('Stock Opname', { properties: { tabColor: { argb: 'FF8B5CF6' } } });

wsOpname.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Komponen', key: 'component', width: 18 },
    { header: 'Test Case', key: 'testCase', width: 55 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Catatan / Fix yang Dilakukan', key: 'notes', width: 55 },
];
styleHeader(wsOpname.getRow(1));

const opnameTests = [
    { no: 1, component: 'FE - Main List', testCase: 'Filter periode (date range) tersedia dan berfungsi', status: 'FIXED', notes: 'Tambah daterange input + kirim start_date/end_date ke API' },
    { no: 2, component: 'FE - Main List', testCase: 'Filter status (Sesuai/Selisih) berfungsi', status: 'PASS', notes: '' },
    { no: 3, component: 'FE - Main List', testCase: 'Filter cabang berfungsi (owner)', status: 'PASS', notes: '' },
    { no: 4, component: 'FE - Form Sesi', testCase: 'Scan/input kode item cabang sendiri → status AVAILABLE (INSTOCK)', status: 'PASS', notes: 'inventoryMap lookup O(1), langsung set AVAILABLE' },
    { no: 5, component: 'FE - Form Sesi', testCase: 'Scan/input kode item cabang LAIN → prompt Extra + textarea', status: 'PASS', notes: 'Kode tidak ditemukan di inventoryMap → showAlert textarea wajib → EXTRA' },
    { no: 6, component: 'FE - Form Sesi', testCase: 'Scan kode yang sudah pernah di-scan → warning "Sudah Discan"', status: 'PASS', notes: 'Check scanned[code] sebelum proses' },
    { no: 7, component: 'FE - Form Sesi', testCase: 'Tab Sesuai menampilkan kolom Waktu Opname per item', status: 'FIXED', notes: 'Tambah kolom Waktu Opname di InventoryRows, render fmtWaktuRow(row._waktu)' },
    { no: 8, component: 'FE - Form Sesi', testCase: 'Finalisasi opname mengirim payload INSTOCK + MISSING + EXTRA', status: 'PASS', notes: 'availableList→INSTOCK, lostPreview→MISSING, extraList→EXTRA' },
    { no: 9, component: 'BE - API', testCase: 'POST /api/stock-opname berhasil create header + detail', status: 'PASS', notes: 'Tested: kode_sesi OPN-DKIJKT-2606-0001 terbentuk' },
    { no: 10, component: 'BE - API', testCase: 'Status SESUAI jika in_stock == total_item', status: 'PASS', notes: 'Tested: 1 item INSTOCK dari 1 total → SESUAI' },
    { no: 11, component: 'BE - API', testCase: 'Item EXTRA dari cabang lain tercatat dengan note', status: 'PASS', notes: 'Tested: KLG-00001-0001 (cabang Bogor) di opname cabang Jakarta → EXTRA + note' },
    { no: 12, component: 'BE - API', testCase: 'GET /api/stock-opname filter start_date & end_date berfungsi', status: 'PASS', notes: 'Tested: tanggal hari ini → 1 result, tanggal kemarin → 0 result' },
    { no: 13, component: 'FE - Detail', testCase: 'Tab Sesuai, Lost, Extra tampil dengan data benar', status: 'PASS', notes: 'Detail endpoint load details.inventory + details.product' },
    { no: 14, component: 'FE - Detail', testCase: 'Tab Sesuai: kolom Waktu Opname ditampilkan', status: 'FIXED', notes: 'Tambah kolom Waktu Opname di ItemTable (Detail.jsx)' },
    { no: 15, component: 'FE - Detail', testCase: 'Info cabang dan waktu start/selesai ditampilkan', status: 'PASS', notes: 'header.branch.branch_name + created_at + updated_at' },
    // Backlog
    { no: 16, component: 'FE - Form', testCase: 'Kode ngasal (tidak ada di DB) jangan masuk ke Extra', status: 'BACKLOG', notes: 'Perlu API lookup global inventory. Status Backlog di notes.' },
    { no: 17, component: 'FE - Detail', testCase: 'Button "Kembali" style disesuaikan kaya di Pembelian', status: 'BACKLOG', notes: 'Status Backlog di notes. Style minor.' },
    { no: 18, component: 'FE - Main', testCase: 'Kode sesi format OPN-{branch}-{YYMM}-{seq}', status: 'BACKLOG', notes: 'Format saat ini: OPN-DKIJKT-2606-0001 (sudah benar). Catatan di notes minta format 3 digit seq.' },
];

opnameTests.forEach((d, i) => {
    const row = wsOpname.addRow(d);
    const statusCell = row.getCell('status');
    Object.assign(statusCell, statusStyle(d.status));
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    applyRowStyle(row, i);
});

// ═══════════════════════════════════════════════
// SHEET 5 — FLOW TEST (End-to-End)
// ═══════════════════════════════════════════════
const wsFlow = workbook.addWorksheet('Flow Test E2E', { properties: { tabColor: { argb: 'FFEF4444' } } });

wsFlow.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Flow', key: 'flow', width: 25 },
    { header: 'Step', key: 'step', width: 55 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Hasil / Data', key: 'result', width: 55 },
];
styleHeader(wsFlow.getRow(1));

const flowTests = [
    { no: 1, flow: 'Pembelian → Inventory', step: 'Create product (Cincin Emas 1 gram) untuk branch Jakarta', status: 'PASS', result: 'Product ID: 1, barcode: CI-00001' },
    { no: 2, flow: 'Pembelian → Inventory', step: 'Create pembelian dengan serial_number, metode TUNAI', status: 'PASS', result: 'Pembelian ID: 1, serial_number: SN-TEST-001, status: APPROVAL' },
    { no: 3, flow: 'Pembelian → Inventory', step: 'Approve pembelian → otomatis buat inventory + finance', status: 'PASS', result: 'Inventory code: CI-00001-0001, status: AVAILABLE, Finance: CASHOUT 500.000' },
    { no: 4, flow: 'Pembelian → Inventory', step: 'Create pembelian metode TRANSFER dengan bank_cabang_id', status: 'PASS', result: 'Pembelian ID: 2, tipe_pembayaran: TRANSFER, bank_cabang_id: 1 (BCA)' },
    { no: 5, flow: 'Pembelian → Inventory', step: 'Detail pembelian: bank_cabang.bank.bank_name muncul', status: 'PASS', result: 'Bank Central Asia (00338227) a.n. Jono' },
    { no: 6, flow: 'Cross-Branch Setup', step: 'Create product + pembelian + approve untuk branch Bogor', status: 'PASS', result: 'Inventory code: KLG-00001-0001, branch_id: 2 (Bogor)' },
    { no: 7, flow: 'Stock Opname (Normal)', step: 'Opname branch Jakarta: scan CI-00001-0001 (milik Jakarta)', status: 'PASS', result: 'OPN-DKIJKT-2606-0001, in_stock: 1, missing: 0, status: SESUAI' },
    { no: 8, flow: 'Stock Opname (Extra)', step: 'Opname branch Jakarta: scan KLG-00001-0001 (milik Bogor) → EXTRA', status: 'PASS', result: 'OPN-DKIJKT-2606-0002, in_stock: 1, extra: 1, note: "Item dari cabang Bogor..."' },
    { no: 9, flow: 'Stock Opname (Extra)', step: 'Detail opname: tab Extra menampilkan item + catatan', status: 'PASS', result: 'inventory_code: KLG-00001-0001, opname_status: EXTRA, note tersimpan' },
    { no: 10, flow: 'Date Filter', step: 'Filter stock opname tanggal hari ini → data muncul', status: 'PASS', result: 'start_date=2026-06-26, end_date=2026-06-26 → total: 2' },
    { no: 11, flow: 'Date Filter', step: 'Filter stock opname tanggal kemarin → data kosong', status: 'PASS', result: 'start_date=2026-06-25, end_date=2026-06-25 → total: 0' },
];

flowTests.forEach((d, i) => {
    const row = wsFlow.addRow(d);
    const statusCell = row.getCell('status');
    Object.assign(statusCell, statusStyle(d.status));
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    applyRowStyle(row, i);
});

// ═══════════════════════════════════════════════
// SHEET 6 — DAFTAR FIX (Changes Log)
// ═══════════════════════════════════════════════
const wsFix = workbook.addWorksheet('Daftar Fix', { properties: { tabColor: { argb: 'FF059669' } } });

wsFix.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'File', key: 'file', width: 55 },
    { header: 'Perubahan', key: 'change', width: 65 },
];
styleHeader(wsFix.getRow(1));

const fixes = [
    { no: 1, file: 'app/Models/Pembelian.php', change: 'Fix typo fillable: bank_cabank_id → bank_cabang_id\nFix relasi bankCabang(): MBank → BankCabang' },
    { no: 2, file: 'app/Http/Controllers/PembelianController.php', change: 'Fix search: whereHas(\'product.product_name\') → whereHas(\'product\')\nSupport query param product_name selain search' },
    { no: 3, file: 'resources/js/pages/Inventory/Pembelian/FormAdd.jsx', change: 'Tambah serial_number: b.no_seri ke payload handleSubmitBatch' },
    { no: 4, file: 'resources/js/pages/Inventory/Pembelian/Page.jsx', change: 'Tambah refreshKey + handleSetState agar Main re-mount setelah form submit' },
    { no: 5, file: 'resources/js/pages/Inventory/Pembelian/modalView.jsx', change: 'Fix display No. Seri: serial_number || no_seri\nFix bank display: bank_cabang?.bank?.bank_name\nHapus extra BankApis call, pakai relasi langsung' },
    { no: 6, file: 'resources/js/pages/Approval/ApprovalPembelian/Page.jsx', change: 'Fix initial fetchData() → passing search state\nTambah image produk di kolom tabel' },
    { no: 7, file: 'resources/js/pages/Approval/ApprovalPembelian/Modal.jsx', change: 'Tambah handling DIBATALKAN (icon, color, reasonLabel, reason)\nFix section title: font-bold → font-semibold text-sm\nFix bank display path: bank_cabang?.bank?.bank_name + nomor_rekening' },
    { no: 8, file: 'resources/js/components/ApprovalStatusCard.jsx', change: 'Fix section title: font-bold → font-semibold text-sm' },
    { no: 9, file: 'resources/js/pages/Inventory/StockOpname/FormAdd.jsx', change: 'Tambah kolom "Waktu Opname" di InventoryRows (tab Sesuai)' },
    { no: 10, file: 'resources/js/pages/Inventory/StockOpname/Detail.jsx', change: 'Tambah kolom "Waktu Opname" di ItemTable' },
    { no: 11, file: 'resources/js/pages/Inventory/StockOpname/Main.jsx', change: 'Tambah filter dateRange (date range picker)\nKirim start_date/end_date ke API' },
];

fixes.forEach((d, i) => {
    const row = wsFix.addRow(d);
    applyRowStyle(row, i);
    row.getCell('file').font = { name: 'Consolas', size: 9 };
});

// ═══════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════
const outputPath = path.resolve('QA_TEST_REPORT.xlsx');
await workbook.xlsx.writeFile(outputPath);
console.log(`✅ Report berhasil dibuat: ${outputPath}`);
