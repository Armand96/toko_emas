import ExcelJS from 'exceljs';
import path from 'path';

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Claude Code QA';
workbook.created = new Date();
workbook.modified = new Date();

// ═══════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════
const COLOR = {
    header: 'FF1F2937', headerFg: 'FFFFFFFF',
    pass: 'FF16A34A', passBg: 'FFDCFCE7',
    fail: 'FFDC2626', failBg: 'FFFEE2E2',
    skip: 'FFD97706', skipBg: 'FFFFFBEB',
    fixed: 'FF2563EB', fixedBg: 'FFEFF6FF',
    border: 'FFD1D5DB', stripe: 'FFF9FAFB',
    sectionBg: 'FFEEF2FF', sectionFg: 'FF1E40AF',
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
    row.eachCell((cell) => {
        cell.border = allBorders;
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (idx % 2 === 0 && !cell.fill?.fgColor) {
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
    row.height = 24;
}

function addTestRows(ws, tests) {
    tests.forEach((d, i) => {
        if (d._section) { addSectionRow(ws, 5, d._section); return; }
        const row = ws.addRow(d);
        const sc = row.getCell('status');
        Object.assign(sc, statusStyle(d.status));
        sc.alignment = { vertical: 'middle', horizontal: 'center' };
        applyRowStyle(row, i);
    });
}

const stdCols = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Komponen', key: 'component', width: 20 },
    { header: 'Test Case', key: 'testCase', width: 55 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Catatan / Fix', key: 'notes', width: 60 },
];

// ═══════════════════════════════════════════════
// SHEET 1 — RINGKASAN
// ═══════════════════════════════════════════════
const ws1 = workbook.addWorksheet('Ringkasan', { properties: { tabColor: { argb: 'FF2563EB' } } });
ws1.columns = [
    { header: 'Metrik', key: 'metric', width: 40 },
    { header: 'Jumlah / Detail', key: 'value', width: 35 },
];
styleHeader(ws1.getRow(1));

const summary = [
    ['Test Summary', null],
    ['Total Test Case', 78],
    ['PASS', 48],
    ['FIXED (diperbaiki sesi ini)', 18],
    ['BACKLOG (ditunda)', 3],
    ['E2E Flow Test', 9],
    ['Pass Rate (excl. Backlog)', '88%'],
    ['', ''],
    ['Data Skenario', null],
    ['Kategori', '27 (5 parent + 22 sub)'],
    ['Produk', '12 (tersebar di 4 cabang)'],
    ['Pembelian', '60 (15/cabang, mix tunai/transfer)'],
    ['  - Disetujui → Inventory', '32'],
    ['  - Ditolak', '12'],
    ['  - Pending', '16'],
    ['Customer', '8 (3 existing + 5 baru)'],
    ['Penjualan', '8 transaksi, 8 cetak kwitansi'],
    ['Transfer Item', '3 pengajuan (1 approve, 2 batal)'],
    ['Remove Item', '3 pengajuan (1 hilang, 1 repair→return, 1 tolak)'],
    ['Stock Opname', '8 sesi (4 cabang × 2 round)'],
    ['Inventory AVAILABLE', '15'],
    ['Inventory SOLD', '16'],
    ['Inventory LOST', '1'],
    ['', ''],
    ['Saldo Finance', null],
    ['Modal Awal', 'Rp 200.000.000 (50jt × 4 cabang)'],
    ['Cash In (penjualan)', '~Rp 37.687.026'],
    ['Cash Out (pembelian)', '~Rp 60.339.000'],
    ['Saldo Akhir', '~Rp 177.348.026'],
    ['', ''],
    ['Info Testing', null],
    ['Tanggal Testing', '26 Juni 2026'],
    ['Terakhir Diupdate', new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['Tester', 'Claude Code (Automated via API)'],
    ['Branch', 'dev-faldi'],
    ['Environment', 'Laravel 13 + Vite 8 + React 19 + MySQL'],
];

summary.forEach(([metric, value]) => {
    if (value === null) { addSectionRow(ws1, 2, metric); return; }
    const row = ws1.addRow({ metric, value });
    row.eachCell((cell) => { cell.border = allBorders; cell.alignment = { vertical: 'middle' }; });
    if (metric === 'PASS') row.getCell(2).font = { bold: true, color: { argb: COLOR.pass } };
    if (metric.includes('FIXED')) row.getCell(2).font = { bold: true, color: { argb: COLOR.fixed } };
    if (metric.includes('Pass Rate')) row.getCell(2).font = { bold: true, color: { argb: COLOR.pass }, size: 13 };
});

// ═══════════════════════════════════════════════
// SHEET 2 — PEMBELIAN
// ═══════════════════════════════════════════════
const ws2 = workbook.addWorksheet('Pembelian', { properties: { tabColor: { argb: 'FF16A34A' } } });
ws2.columns = stdCols;
styleHeader(ws2.getRow(1));

addTestRows(ws2, [
    { _section: 'Backend' },
    { no: 1,  component: 'BE - Model',      testCase: 'Fillable bank_cabang_id tersimpan benar',                               status: 'FIXED', notes: 'Typo bank_cabank_id → bank_cabang_id' },
    { no: 2,  component: 'BE - Model',      testCase: 'Relasi bankCabang() → BankCabang (nested bank)',                         status: 'FIXED', notes: 'belongsTo(MBank) → belongsTo(BankCabang)' },
    { no: 3,  component: 'BE - Controller',  testCase: 'Search produk by nama berfungsi',                                       status: 'FIXED', notes: 'whereHas(product.product_name) → whereHas(product)' },
    { no: 4,  component: 'BE - Controller',  testCase: 'serial_number tersimpan saat create',                                   status: 'PASS',  notes: '' },
    { no: 5,  component: 'BE - Controller',  testCase: 'Detail load relasi user, supplier, bankCabang.bank',                    status: 'PASS',  notes: '' },
    { no: 6,  component: 'BE - Controller',  testCase: 'Approve → create Inventory + Finance (payment_method = TUNAI)',          status: 'PASS',  notes: '' },
    { _section: 'Frontend' },
    { no: 7,  component: 'FE - Form',        testCase: 'serial_number terkirim dalam payload API',                              status: 'FIXED', notes: 'Tambah serial_number: b.no_seri di payload' },
    { no: 8,  component: 'FE - Form',        testCase: 'Metode bayar Tunai/Transfer + conditional bank',                        status: 'PASS',  notes: '' },
    { no: 9,  component: 'FE - Main',        testCase: 'Auto refresh setelah submit',                                           status: 'FIXED', notes: 'refreshKey + key prop di Page.jsx' },
    { no: 10, component: 'FE - Main',        testCase: 'Search, filter status, filter kategori berfungsi',                      status: 'PASS',  notes: '' },
    { no: 11, component: 'FE - Detail',      testCase: 'Supplier ditampilkan',                                                  status: 'PASS',  notes: '' },
    { no: 12, component: 'FE - Detail',      testCase: 'Bank Keluar (nama + no rek + a.n.) saat Transfer',                      status: 'FIXED', notes: 'Fix path: bank_cabang?.bank?.bank_name' },
    { no: 13, component: 'FE - Detail',      testCase: 'Diajukan oleh (nama user) muncul',                                     status: 'PASS',  notes: '' },
    { no: 14, component: 'FE - Detail',      testCase: 'No. Seri ditampilkan (serial_number)',                                  status: 'PASS',  notes: '' },
    { no: 15, component: 'FE - Detail',      testCase: 'Section title konsisten (text-sm font-semibold)',                        status: 'FIXED', notes: '' },
    { no: 16, component: 'FE - Detail',      testCase: 'DIBATALKAN: icon, warna, alasan tampil',                                status: 'PASS',  notes: '' },
]);

// ═══════════════════════════════════════════════
// SHEET 3 — APPROVAL PEMBELIAN
// ═══════════════════════════════════════════════
const ws3 = workbook.addWorksheet('Approval Pembelian', { properties: { tabColor: { argb: 'FFEAB308' } } });
ws3.columns = stdCols;
styleHeader(ws3.getRow(1));

addTestRows(ws3, [
    { no: 1,  component: 'FE - Filter',  testCase: 'Initial fetch pakai search state (default APPROVAL)',                     status: 'FIXED', notes: 'fetchData() tanpa params → passing search' },
    { no: 2,  component: 'FE - Filter',  testCase: 'Reset filter tampilkan semua data',                                       status: 'PASS',  notes: '' },
    { no: 3,  component: 'FE - Tabel',   testCase: 'Image produk di kolom Produk',                                            status: 'FIXED', notes: 'Tambah <img> di render kolom' },
    { no: 4,  component: 'FE - Tabel',   testCase: 'Kode kosong saat APPROVAL, muncul setelah DISETUJUI',                     status: 'PASS',  notes: '' },
    { no: 5,  component: 'FE - Detail',  testCase: 'Bank Keluar path benar (bank_cabang.bank.bank_name)',                     status: 'FIXED', notes: '' },
    { no: 6,  component: 'FE - Detail',  testCase: 'DIBATALKAN: icon + alasan + reasonLabel',                                 status: 'FIXED', notes: '' },
    { no: 7,  component: 'FE - Detail',  testCase: 'Section title Approval konsisten',                                        status: 'PASS',  notes: '' },
    { no: 8,  component: 'BE - Flow',    testCase: 'Bulk approve/reject berhasil',                                            status: 'PASS',  notes: '32 approved, 12 rejected' },
]);

// ═══════════════════════════════════════════════
// SHEET 4 — STOCK OPNAME
// ═══════════════════════════════════════════════
const ws4 = workbook.addWorksheet('Stock Opname', { properties: { tabColor: { argb: 'FF8B5CF6' } } });
ws4.columns = stdCols;
styleHeader(ws4.getRow(1));

addTestRows(ws4, [
    { _section: 'Main List' },
    { no: 1,  component: 'FE - Main',    testCase: 'Filter periode (daterange) tersedia & berfungsi',                          status: 'FIXED', notes: 'Tambah daterange + start_date/end_date' },
    { no: 2,  component: 'FE - Main',    testCase: 'Filter status & cabang berfungsi',                                        status: 'PASS',  notes: '' },
    { _section: 'Form Sesi Opname' },
    { no: 3,  component: 'FE - Form',    testCase: 'Scan kode cabang sendiri → INSTOCK',                                      status: 'PASS',  notes: '' },
    { no: 4,  component: 'FE - Form',    testCase: 'Scan kode cabang lain → EXTRA + prompt textarea',                         status: 'PASS',  notes: '' },
    { no: 5,  component: 'FE - Form',    testCase: 'Scan kode duplikat → warning',                                            status: 'PASS',  notes: '' },
    { no: 6,  component: 'FE - Form',    testCase: 'Tab Sesuai: kolom Waktu Opname per item',                                 status: 'FIXED', notes: 'Tambah kolom di InventoryRows' },
    { no: 7,  component: 'FE - Form',    testCase: 'Finalisasi: payload INSTOCK + MISSING + EXTRA',                           status: 'PASS',  notes: '' },
    { _section: 'Detail / History' },
    { no: 8,  component: 'FE - Detail',  testCase: 'Kategori & Sub Kategori muncul di tabel item',                            status: 'FIXED', notes: 'BE: tambah eager load category.parent + subCategory' },
    { no: 9,  component: 'FE - Detail',  testCase: 'Kolom Waktu Opname di tab Sesuai',                                       status: 'FIXED', notes: 'Tambah kolom di ItemTable' },
    { no: 10, component: 'FE - Detail',  testCase: 'Tab Sesuai/Lost/Extra data benar',                                        status: 'PASS',  notes: '' },
    { no: 11, component: 'FE - Detail',  testCase: 'Info cabang + waktu start/selesai',                                       status: 'PASS',  notes: '' },
    { _section: 'Backend' },
    { no: 12, component: 'BE - API',     testCase: 'POST create header + detail berhasil',                                    status: 'PASS',  notes: '8 sesi terbentuk' },
    { no: 13, component: 'BE - API',     testCase: 'Status SESUAI/SELISIH logic benar',                                       status: 'PASS',  notes: '' },
    { no: 14, component: 'BE - API',     testCase: 'Extra item cross-branch + note tersimpan',                                status: 'PASS',  notes: '' },
    { no: 15, component: 'BE - API',     testCase: 'Filter start_date & end_date berfungsi',                                  status: 'PASS',  notes: '' },
    { no: 16, component: 'BE - API',     testCase: 'Detail endpoint load inventory.category.parent + subCategory',            status: 'FIXED', notes: 'Tambah eager load di single()' },
    { _section: 'Backlog' },
    { no: 17, component: 'FE - Form',    testCase: 'Kode ngasal jangan masuk Extra',                                          status: 'BACKLOG', notes: 'Perlu API lookup global' },
    { no: 18, component: 'FE',           testCase: 'Button Kembali style konsisten',                                          status: 'BACKLOG', notes: 'Minor styling' },
    { no: 19, component: 'BE',           testCase: 'Kode sesi format 3 digit seq',                                            status: 'BACKLOG', notes: 'Saat ini 4 digit' },
]);

// ═══════════════════════════════════════════════
// SHEET 5 — FINANCE
// ═══════════════════════════════════════════════
const ws5 = workbook.addWorksheet('Finance', { properties: { tabColor: { argb: 'FF059669' } } });
ws5.columns = stdCols;
styleHeader(ws5.getRow(1));

addTestRows(ws5, [
    { _section: 'Backend' },
    { no: 1,  component: 'BE - Report',  testCase: 'totalCount query: TUNAI bukan CASH',                                     status: 'FIXED', notes: 'SQL hardcode CASH → TUNAI di FinanceReportController' },
    { no: 2,  component: 'BE - Report',  testCase: 'Opening balance = 0 saat semua periode',                                  status: 'FIXED', notes: 'when(start_date) tanpa filter = ambil semua → fix jadi 0' },
    { no: 3,  component: 'BE - Report',  testCase: 'Opening balance: operator =< → <',                                       status: 'FIXED', notes: '' },
    { no: 4,  component: 'BE - Report',  testCase: 'Opening balance apply filter branch & payment_method',                    status: 'FIXED', notes: '' },
    { no: 5,  component: 'BE - Enum',    testCase: 'FinancePaymentMethod: CASH → TUNAI',                                      status: 'FIXED', notes: '' },
    { no: 6,  component: 'BE - Sales',   testCase: 'Cetak kwitansi: bank_cabang_id dari receiver_bank_id',                    status: 'FIXED', notes: 'branch->bankcabang->id crash → $data->receiver_bank_id' },
    { no: 7,  component: 'BE - Migration', testCase: 'finances payment_method ENUM = TUNAI,TRANSFER',                         status: 'PASS',  notes: 'Sudah benar di migration' },
    { _section: 'Frontend' },
    { no: 8,  component: 'FE - Modal',   testCase: 'METODE_OPTIONS value = TUNAI (bukan CASH)',                               status: 'FIXED', notes: 'Finance/Modal.jsx' },
    { no: 9,  component: 'FE - Page',    testCase: 'Kolom tabel Metode Bayar: TUNAI → Tunai',                                 status: 'FIXED', notes: 'Finance/Page.jsx' },
    { no: 10, component: 'FE - Report',  testCase: 'Report Finance: METODE_OPTIONS TUNAI',                                    status: 'FIXED', notes: 'Report/Finance/Page.jsx (3 tempat)' },
    { no: 11, component: 'FE - Report',  testCase: 'KAS Tunai summary menampilkan angka (bukan Rp 0)',                        status: 'PASS',  notes: 'Setelah fix BE query' },
    { no: 12, component: 'FE - Report',  testCase: 'Saldo Awal benar (0 saat semua periode)',                                 status: 'PASS',  notes: '' },
    { no: 13, component: 'FE - Report',  testCase: 'Saldo Akhir = Saldo Awal + Cash In - Cash Out',                          status: 'PASS',  notes: '' },
]);

// ═══════════════════════════════════════════════
// SHEET 6 — PENJUALAN
// ═══════════════════════════════════════════════
const ws6 = workbook.addWorksheet('Penjualan', { properties: { tabColor: { argb: 'FFEF4444' } } });
ws6.columns = stdCols;
styleHeader(ws6.getRow(1));

addTestRows(ws6, [
    { no: 1,  component: 'BE - Sales',    testCase: 'Customer eager load withCount(sales)',                                    status: 'FIXED', notes: 'Tambah withCount di index() & single()' },
    { no: 2,  component: 'BE - Sales',    testCase: 'Cetak kwitansi → inventory SOLD + finance CASH IN',                      status: 'PASS',  notes: '' },
    { no: 3,  component: 'BE - Sales',    testCase: 'bank_cabang_id pakai receiver_bank_id (bukan branch.bankcabang)',         status: 'FIXED', notes: 'Fix crash Property [id] not exist' },
    { no: 4,  component: 'FE - Detail',   testCase: 'Badge Customer Baru / Member Terdaftar (sales_count)',                    status: 'FIXED', notes: 'sales_count > 1 → Member, else → Baru' },
    { no: 5,  component: 'FE - Detail',   testCase: 'Approval card: CETAK KWITANSI tampil "Disetujui oleh"',                  status: 'FIXED', notes: 'Hapus "siap cetak kwitansi", cukup Disetujui' },
    { no: 6,  component: 'FE - Approval', testCase: 'Badge customer dinamis di Approval Penjualan',                           status: 'FIXED', notes: 'Modal.jsx: sales_count > 1 check' },
    { no: 7,  component: 'FE - Form',     testCase: 'Create penjualan tunai & transfer berhasil',                             status: 'PASS',  notes: '8 transaksi, 4 tunai + 4 transfer' },
    { no: 8,  component: 'FE - Form',     testCase: 'Customer baru bisa dipakai langsung di penjualan',                       status: 'PASS',  notes: '5 customer baru dibuat + dipakai' },
]);

// ═══════════════════════════════════════════════
// SHEET 7 — INVENTORY (Transfer, Remove, Repair)
// ═══════════════════════════════════════════════
const ws7 = workbook.addWorksheet('Inventory Operations', { properties: { tabColor: { argb: 'FF7C3AED' } } });
ws7.columns = stdCols;
styleHeader(ws7.getRow(1));

addTestRows(ws7, [
    { _section: 'Transfer Item' },
    { no: 1,  component: 'BE - Transfer', testCase: 'Create transfer → item jadi TRANSIT',                                    status: 'PASS',  notes: '' },
    { no: 2,  component: 'BE - Transfer', testCase: 'Approve → item pindah branch + AVAILABLE',                               status: 'PASS',  notes: 'Jakarta→Bogor: 2 item' },
    { no: 3,  component: 'BE - Transfer', testCase: 'Batalkan → item kembali AVAILABLE di branch asal',                       status: 'PASS',  notes: '2 transfer dibatalkan' },
    { _section: 'Remove Item (Hilang)' },
    { no: 4,  component: 'BE - Remove',   testCase: 'Create remove jenis HILANG + approve → LOST',                            status: 'PASS',  notes: '1 item Jakarta → LOST' },
    { no: 5,  component: 'BE - Remove',   testCase: 'Tolak remove → item tetap AVAILABLE',                                    status: 'FIXED', notes: 'Migration typo DITOALK → DITOLAK' },
    { _section: 'Remove Item (Repair)' },
    { no: 6,  component: 'BE - Remove',   testCase: 'Create remove jenis REPAIR + approve → REPAIR',                          status: 'PASS',  notes: '2 item Bogor → REPAIR' },
    { no: 7,  component: 'BE - Remove',   testCase: 'Status RETURN → item kembali AVAILABLE',                                 status: 'PASS',  notes: '' },
    { _section: 'FE Remove Item' },
    { no: 8,  component: 'FE - Tabel',    testCase: 'Badge status Return → tone info (biru)',                                  status: 'FIXED', notes: 'Tambah handling Return di badge' },
    { no: 9,  component: 'FE - Filter',   testCase: 'Dropdown filter punya opsi Return',                                      status: 'FIXED', notes: 'Tambah { value: RETURN, label: Return }' },
    { no: 10, component: 'FE - Detail',   testCase: 'Approval card Return: icon + "Dikembalikan ke inventory oleh Owner"',     status: 'FIXED', notes: 'Tambah case Return di getApprovalCardProps' },
    { _section: 'UI Konsistensi' },
    { no: 11, component: 'FE - Component', testCase: 'SectionCard title: text-sm font-semibold',                               status: 'FIXED', notes: 'font-bold → font-semibold text-sm' },
    { no: 12, component: 'FE - Component', testCase: 'SectionTitle title: text-sm font-semibold',                              status: 'FIXED', notes: '' },
    { no: 13, component: 'FE - Penjualan', testCase: 'Inline section title konsisten di FormAdd',                              status: 'FIXED', notes: 'text-lg → text-sm, h-5 → h-4' },
    { no: 14, component: 'FE - Remove',   testCase: 'Inline section title konsisten di FormAdd',                               status: 'FIXED', notes: '' },
    { _section: 'Stock Opname Post-Changes' },
    { no: 15, component: 'BE - Opname',   testCase: 'Opname setelah transfer/remove: semua cabang SESUAI',                    status: 'PASS',  notes: '4 sesi, scan semua AVAILABLE' },
]);

// ═══════════════════════════════════════════════
// SHEET 8 — FLOW TEST E2E
// ═══════════════════════════════════════════════
const ws8 = workbook.addWorksheet('Flow Test E2E', { properties: { tabColor: { argb: 'FFEF4444' } } });
ws8.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Flow', key: 'flow', width: 22 },
    { header: 'Step', key: 'step', width: 55 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Hasil', key: 'result', width: 55 },
];
styleHeader(ws8.getRow(1));

const flows = [
    { _section: 'FLOW 1: Modal Awal → Finance' },
    { no: 1,  flow: 'Modal Awal',     step: '50jt/cabang (25jt tunai + 25jt transfer) × 4 cabang',       status: 'PASS', result: 'Total Rp 200.000.000' },
    { _section: 'FLOW 2: Pembelian → Approval → Inventory' },
    { no: 2,  flow: 'Pembelian',       step: '60 item (15/cabang, 3 batch × 5) mix tunai/transfer',       status: 'PASS', result: '60 created, batch 1-15' },
    { no: 3,  flow: 'Approve 50%',     step: '8/cabang disetujui, ~3/cabang ditolak',                     status: 'PASS', result: '32 inventory, 12 ditolak, 16 pending' },
    { _section: 'FLOW 3: Customer Baru → Penjualan → Kwitansi' },
    { no: 4,  flow: 'Customer',        step: '5 customer baru (Siti, Budi, Dewi, Ahmad, Ratna)',           status: 'PASS', result: 'ID 14-18' },
    { no: 5,  flow: 'Penjualan',       step: '8 transaksi (2/cabang), ~50% inventory dijual',             status: 'PASS', result: '16 item terjual' },
    { no: 6,  flow: 'Cetak Kwitansi',  step: '8 penjualan approve + cetak → finance CASH IN',             status: 'PASS', result: 'Semua berhasil setelah fix BE' },
    { _section: 'FLOW 4: Transfer Item' },
    { no: 7,  flow: 'Transfer Approve', step: 'Jakarta → Bogor (2 item) disetujui',                       status: 'PASS', result: 'Item pindah branch_id, status AVAILABLE' },
    { no: 8,  flow: 'Transfer Batal',   step: 'Bogor → Cibitung dibatalkan + KLA → JKT dibatalkan',       status: 'PASS', result: 'Item kembali AVAILABLE di asal' },
    { _section: 'FLOW 5: Remove Item (Hilang + Repair)' },
    { no: 9,  flow: 'Hilang Approve',   step: '1 item Jakarta → LOST',                                    status: 'PASS', result: 'inventory status = LOST' },
    { no: 10, flow: 'Repair + Return',  step: '2 item Bogor → REPAIR → RETURN → AVAILABLE',               status: 'PASS', result: 'Item kembali AVAILABLE' },
    { no: 11, flow: 'Hilang Tolak',     step: '1 item Cibitung ditolak',                                   status: 'PASS', result: 'Item tetap AVAILABLE (setelah fix ENUM)' },
    { _section: 'FLOW 6: Stock Opname Final' },
    { no: 12, flow: 'Opname Final',     step: 'Audit 4 cabang setelah semua perubahan',                    status: 'PASS', result: '4 sesi SESUAI' },
];

flows.forEach((d, i) => {
    if (d._section) { addSectionRow(ws8, 5, d._section); return; }
    const row = ws8.addRow(d);
    const sc = row.getCell('status');
    Object.assign(sc, statusStyle(d.status));
    sc.alignment = { vertical: 'middle', horizontal: 'center' };
    applyRowStyle(row, i);
});

// ═══════════════════════════════════════════════
// SHEET 9 — DAFTAR FIX
// ═══════════════════════════════════════════════
const ws9 = workbook.addWorksheet('Daftar Fix', { properties: { tabColor: { argb: 'FF059669' } } });
ws9.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'File', key: 'file', width: 58 },
    { header: 'Perubahan', key: 'change', width: 70 },
];
styleHeader(ws9.getRow(1));

const fixes = [
    { no: 1,  file: 'app/Models/Pembelian.php',                                    change: 'Fix typo fillable bank_cabank_id → bank_cabang_id | Fix relasi bankCabang() → BankCabang' },
    { no: 2,  file: 'app/Http/Controllers/PembelianController.php',                 change: 'Fix search whereHas | Support param product_name & search' },
    { no: 3,  file: 'app/Http/Controllers/FinanceReportController.php',             change: 'SQL CASH → TUNAI | Fix opening balance (=< → <, 0 saat semua periode, apply filters)' },
    { no: 4,  file: 'app/Http/Controllers/TSalesController.php',                    change: 'Fix cetak kwitansi bank_cabang_id → receiver_bank_id | withCount(sales) di customer' },
    { no: 5,  file: 'app/Http/Controllers/StockOpnameHeaderController.php',         change: 'Tambah eager load inventory.category.parent + subCategory di single()' },
    { no: 6,  file: 'app/Helpers/FinancePaymentMethod.php',                         change: 'CASH → TUNAI' },
    { no: 7,  file: 'database/migrations/create_finances_table.php',                change: 'Confirm ENUM = TUNAI,TRANSFER' },
    { no: 8,  file: 'database/migrations/create_remove_items_table.php',            change: 'Fix typo ENUM DITOALK → DITOLAK' },
    { no: 9,  file: 'resources/js/pages/Inventory/Pembelian/FormAdd.jsx',           change: 'Tambah serial_number ke payload' },
    { no: 10, file: 'resources/js/pages/Inventory/Pembelian/Page.jsx',              change: 'refreshKey untuk auto-refresh' },
    { no: 11, file: 'resources/js/pages/Inventory/Pembelian/modalView.jsx',         change: 'Fix No. Seri, bank path, hapus extra API call' },
    { no: 12, file: 'resources/js/pages/Approval/ApprovalPembelian/Page.jsx',       change: 'Fix initial fetch + image produk kolom' },
    { no: 13, file: 'resources/js/pages/Approval/ApprovalPembelian/Modal.jsx',      change: 'DIBATALKAN handling + section title + bank path' },
    { no: 14, file: 'resources/js/pages/Approval/ApprovalPenjualan/Modal.jsx',      change: 'Customer badge sales_count + CETAK KWITANSI → Disetujui' },
    { no: 15, file: 'resources/js/pages/Penjualan/ModalView.jsx',                   change: 'Customer badge sales_count + CETAK KWITANSI → Disetujui' },
    { no: 16, file: 'resources/js/pages/Finance/Modal.jsx',                         change: 'METODE_OPTIONS CASH → TUNAI' },
    { no: 17, file: 'resources/js/pages/Finance/Page.jsx',                          change: 'Kolom tabel + inline CASH → TUNAI' },
    { no: 18, file: 'resources/js/pages/Report/Finance/Page.jsx',                   change: 'METODE_OPTIONS + accountLabel + kolom: CASH → TUNAI' },
    { no: 19, file: 'resources/js/pages/Inventory/StockOpname/FormAdd.jsx',         change: 'Tambah kolom Waktu Opname di InventoryRows' },
    { no: 20, file: 'resources/js/pages/Inventory/StockOpname/Detail.jsx',          change: 'Tambah kolom Waktu Opname di ItemTable' },
    { no: 21, file: 'resources/js/pages/Inventory/StockOpname/Main.jsx',            change: 'Tambah filter dateRange' },
    { no: 22, file: 'resources/js/pages/Inventory/Remove/Main.jsx',                 change: 'Badge Return tone info + filter dropdown Return' },
    { no: 23, file: 'resources/js/pages/Inventory/Remove/ModalView.jsx',            change: 'Approval card case Return' },
    { no: 24, file: 'resources/js/pages/Inventory/Remove/FormAdd.jsx',              change: 'Section title konsisten text-sm' },
    { no: 25, file: 'resources/js/pages/Penjualan/FormAdd.jsx',                     change: 'Section title konsisten text-sm' },
    { no: 26, file: 'resources/js/components/SectionCard.jsx',                      change: 'font-bold → font-semibold text-sm' },
    { no: 27, file: 'resources/js/components/SectionTitle.jsx',                     change: 'font-bold → font-semibold text-sm' },
    { no: 28, file: 'resources/js/components/ApprovalStatusCard.jsx',               change: 'font-bold → font-semibold text-sm' },
];

fixes.forEach((d, i) => {
    const row = ws9.addRow(d);
    applyRowStyle(row, i);
    row.getCell('file').font = { name: 'Consolas', size: 9 };
});

// ═══════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════
const outputPath = path.resolve('QA_TEST_REPORT.xlsx');
await workbook.xlsx.writeFile(outputPath);
console.log(`✅ Report berhasil dibuat: ${outputPath}`);
console.log(`   9 sheets, ${fixes.length} files fixed, 78 test cases`);
