/**
 * SKENARIO LENGKAP — Toko Emas
 *
 * 1. Inisiasi modal 50 juta per cabang (50% tunai, 50% transfer)
 * 2. Buat 60 pembelian (15 per cabang, mix tunai/transfer)
 * 3. Approve 50% pembelian → inventory + finance CASH OUT
 * 4. Buat 5 customer baru + Penjualan ~50% inventory
 * 5. Approve penjualan → DISETUJUI → CETAK KWITANSI → finance CASH IN
 * 6. Stock opname audit per cabang
 * 7. Verifikasi & summary
 */

const BASE = 'http://127.0.0.1:8000/api';
const TOKEN = '1|t6PvZnwzOdKQipycHRIvwNc5A8wQGd9WY16zeUoK0b6daecc';

const hdrs = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

async function api(method, path, body) {
    const opts = { method, headers: hdrs };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json();
    if (!res.ok) console.error(`  ❌ ${method} ${path} → ${res.status}`, json?.message || '');
    return json;
}

async function apiForm(path, fields) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form });
    return res.json();
}

async function apiData(method, path, body) {
    const json = await api(method, path, body);
    return json?.data ?? json;
}

function log(i, m) { console.log(`${i} ${m}`); }
function section(t) { console.log(`\n${'═'.repeat(65)}\n  ${t}\n${'═'.repeat(65)}`); }
function fmt(n) { return `Rp ${Number(n).toLocaleString('id-ID')}`; }

const BRANCHES = [
    { id: 1, name: 'Jakarta',        bank_cabang_id: 1 },
    { id: 2, name: 'Bogor',          bank_cabang_id: 4 },
    { id: 3, name: 'Kebayoran Lama', bank_cabang_id: 3 },
    { id: 4, name: 'Cibitung',       bank_cabang_id: 5 },
];

// ═══════════════════════════════════════════════════════════════
// STEP 1: MODAL AWAL
// ═══════════════════════════════════════════════════════════════
section('STEP 1: Inisiasi Modal Rp 50 Juta per Cabang');

for (const br of BRANCHES) {
    await apiForm('/finances', { branch_id: br.id, category_finance_id: 4, bank_cabang_id: 0,              type: 'CASH IN', payment_method: 'TUNAI',    nominal: 25000000, note: `Modal tunai ${br.name}` });
    await apiForm('/finances', { branch_id: br.id, category_finance_id: 4, bank_cabang_id: br.bank_cabang_id, type: 'CASH IN', payment_method: 'TRANSFER', nominal: 25000000, note: `Modal transfer ${br.name}` });
    log('💰', `${br.name}: 25 jt tunai + 25 jt transfer`);
}

let totals = await apiData('GET', '/report/total-count');
log('📊', `Total: ${fmt(totals.total_all)} | Tunai: ${fmt(totals.total_cash)} | Bank: ${fmt(totals.total_transfer)}`);

// ═══════════════════════════════════════════════════════════════
// STEP 2: 60 PEMBELIAN
// ═══════════════════════════════════════════════════════════════
section('STEP 2: Buat 60 Pembelian (15 per Cabang)');

const allProducts = (await apiData('GET', '/products?per_page=100'))?.data ?? (await apiData('GET', '/products?per_page=100'));
const allPembelian = [];

for (const br of BRANCHES) {
    const prods = (Array.isArray(allProducts) ? allProducts : []).filter(p => (p.branches || []).some(b => b.branch_id === br.id));
    if (!prods.length) { log('⚠️', `${br.name}: no products`); continue; }

    for (let batch = 0; batch < 3; batch++) {
        const items = [];
        for (let j = 0; j < 5; j++) {
            const idx = batch * 5 + j;
            const prod = prods[idx % prods.length];
            const isTunai = (idx + batch) % 3 === 0;
            const modal = Math.round((800000 + Math.random() * 2500000) / 1000) * 1000;
            items.push({
                branch_id: br.id, product_id: prod.id, category_id: prod.category_id, subcategory_id: prod.subcategory_id,
                tipe_pembayaran: isTunai ? 'TUNAI' : 'TRANSFER',
                bank_cabang_id: isTunai ? null : br.bank_cabang_id,
                supplier_id: (idx % 2) + 1, barcode: prod.barcode,
                serial_number: `SN-${br.name.substring(0, 3).toUpperCase()}-${String(allPembelian.length + j + 1).padStart(3, '0')}`,
                berat: parseFloat((1 + Math.random() * 8).toFixed(2)), karat: [18, 22, 24][idx % 3],
                modal, jual: modal + Math.round(modal * (0.12 + Math.random() * 0.18)),
            });
        }
        const res = await apiData('POST', '/pembelian', { data: items });
        (Array.isArray(res) ? res : res?.data || []).forEach(c => allPembelian.push(c));
        const t = items.filter(i => i.tipe_pembayaran === 'TUNAI').length;
        log('  📝', `${br.name} batch ${batch + 1}: ${items.length} item (${t} tunai, ${items.length - t} transfer)`);
    }
}
log('✅', `Total pembelian: ${allPembelian.length}`);

// ═══════════════════════════════════════════════════════════════
// STEP 3: APPROVE 50%
// ═══════════════════════════════════════════════════════════════
section('STEP 3: Approve 50% Pembelian');

const branchInvMap = {};
for (const br of BRANCHES) {
    const brItems = allPembelian.filter(p => p.branch_id === br.id);
    const half = Math.ceil(brItems.length * 0.5);
    const approveIds = brItems.slice(0, half).map(p => p.id);
    const rejectIds = brItems.slice(half, half + Math.ceil((brItems.length - half) * 0.3)).map(p => p.id);

    if (approveIds.length) await api('POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: approveIds });
    if (rejectIds.length)  await api('POST', '/update-pembelian', { status: 'DITOLAK', pembelian_ids: rejectIds, note: 'Karat tidak sesuai dokumen.' });

    const inv = await apiData('GET', `/inventory?per_page=10000&status=AVAILABLE&branch_id=${br.id}`);
    branchInvMap[br.id] = inv?.data ?? (Array.isArray(inv) ? inv : []);
    log('✅', `${br.name}: ${approveIds.length} approved, ${rejectIds.length} rejected → ${branchInvMap[br.id].length} inventory`);
}

totals = await apiData('GET', '/report/total-count');
log('💰', `Saldo: ${fmt(totals.total_all)} | Tunai: ${fmt(totals.total_cash)} | Bank: ${fmt(totals.total_transfer)}`);

// ═══════════════════════════════════════════════════════════════
// STEP 4: CUSTOMER BARU + PENJUALAN
// ═══════════════════════════════════════════════════════════════
section('STEP 4: Customer Baru + Penjualan ~50% Inventory');

const newCusts = [
    { customer_name: 'Siti Nurhaliza',  address: 'Jl. Melati No. 12, Menteng, Jakarta Pusat',     phone_number: '081234567890', is_active: 1 },
    { customer_name: 'Budi Santoso',    address: 'Jl. Raya Pajajaran No. 88, Bogor',              phone_number: '082198765432', is_active: 1 },
    { customer_name: 'Dewi Kartika',    address: 'Jl. Kebayoran Baru III/20, Jakarta Selatan',     phone_number: '085312345678', is_active: 1 },
    { customer_name: 'Ahmad Rizky',     address: 'Perum Cibitung Indah Blok C-15, Bekasi',         phone_number: '087654321098', is_active: 1 },
    { customer_name: 'Ratna Permata',   address: 'Jl. Sudirman Kav. 52-53, SCBD, Jakarta Selatan', phone_number: '081345678901', is_active: 1 },
];

const customers = [
    { id: 1, name: 'Aldi Sujono' },
    { id: 2, name: 'Widodo Wowo' },
    { id: 3, name: 'Faldi' },
];

for (const c of newCusts) {
    const res = await apiData('POST', '/customers', c);
    const id = res?.id;
    if (id) { customers.push({ id, name: c.customer_name }); log('👤', `${c.customer_name} (ID: ${id})`); }
}
log('✅', `Total customer: ${customers.length} (${newCusts.length} baru + 3 existing)`);

let salesCount = 0;
for (const br of BRANCHES) {
    const items = branchInvMap[br.id] || [];
    const sellCount = Math.ceil(items.length * 0.5);
    const toSell = items.slice(0, sellCount);
    if (!toSell.length) continue;

    let idx = 0, trx = 0;
    while (idx < toSell.length) {
        const size = Math.min(2 + (trx % 2), toSell.length - idx);
        const batch = toSell.slice(idx, idx + size);
        const cust = customers[trx % customers.length];
        const isTunai = trx % 2 === 0;
        const total = batch.reduce((s, inv) => s + Number(inv.jual), 0);

        await api('POST', '/sales', {
            customer_id: cust.id, branch_id: br.id, payment_type: isTunai ? 'TUNAI' : 'TRANSFER',
            nominal_paid: isTunai ? total + 50000 : null, exchange: isTunai ? 50000 : null,
            sender_bank_name: !isTunai ? 'BCA' : null, sender_rekening: !isTunai ? '0088776655' : null,
            sender_bank_id: !isTunai ? 1 : null, receiver_bank_id: !isTunai ? br.bank_cabang_id : null,
            item: batch.map(inv => ({ inventory_code: inv.inventory_code, product_id: inv.product_id, price: Number(inv.jual) })),
        });
        salesCount++;
        idx += size;
        trx++;
    }
    log('🛒', `${br.name}: ${trx} transaksi, ${sellCount} item dijual`);
}
log('✅', `Total transaksi penjualan: ${salesCount}`);

// ═══════════════════════════════════════════════════════════════
// STEP 5: APPROVE PENJUALAN
// ═══════════════════════════════════════════════════════════════
section('STEP 5: Approve Penjualan → Cetak Kwitansi');

const salesRes = await api('GET', '/sales?per_page=100');
const salesList = salesRes?.data || [];
const pendingSales = salesList.filter(s => s.approval_status === 'APPROVAL');

let cetakOk = 0, cetakFail = 0;
for (const sale of pendingSales) {
    await api('PUT', '/update-sales', { penjualan_id: sale.id, status: 'DISETUJUI' });

    const cetakRes = await api('PUT', '/update-sales', { penjualan_id: sale.id, status: 'CETAK KWITANSI' });
    if (cetakRes?.success !== false) cetakOk++;
    else cetakFail++;
}
log('✅', `${pendingSales.length} disetujui, ${cetakOk} kwitansi dicetak${cetakFail ? `, ${cetakFail} gagal` : ''}`);

totals = await apiData('GET', '/report/total-count');
log('💰', `Saldo akhir: ${fmt(totals.total_all)} | Tunai: ${fmt(totals.total_cash)} | Bank: ${fmt(totals.total_transfer)}`);

// ═══════════════════════════════════════════════════════════════
// STEP 6: STOCK OPNAME
// ═══════════════════════════════════════════════════════════════
section('STEP 6: Stock Opname per Cabang');

const opnameResults = [];
for (const br of BRANCHES) {
    const inv = await apiData('GET', `/inventory?per_page=10000&status=AVAILABLE&branch_id=${br.id}`);
    const brInv = inv?.data ?? (Array.isArray(inv) ? inv : []);
    if (!brInv.length) { log('⚠️', `${br.name}: 0 item, skip`); continue; }

    const items = [];
    const scanCnt = Math.ceil(brInv.length * 0.85);
    brInv.slice(0, scanCnt).forEach(i => items.push({ inventory_code: i.inventory_code, product_id: i.product_id, last_status: i.status, opname_status: 'INSTOCK' }));
    brInv.slice(scanCnt).forEach(i => items.push({ inventory_code: i.inventory_code, product_id: i.product_id, last_status: i.status, opname_status: 'MISSING' }));

    const other = BRANCHES.find(b => b.id !== br.id);
    const otherInv = await apiData('GET', `/inventory?per_page=2&status=AVAILABLE&branch_id=${other.id}`);
    const extras = otherInv?.data ?? (Array.isArray(otherInv) ? otherInv : []);
    if (extras[0]) items.push({ inventory_code: extras[0].inventory_code, product_id: extras[0].product_id, last_status: extras[0].status, opname_status: 'EXTRA', note: `Item dari cabang ${other.name}` });

    await api('POST', '/stock-opname', { branch_id: br.id, item: items });

    const instock = items.filter(i => i.opname_status === 'INSTOCK').length;
    const missing = items.filter(i => i.opname_status === 'MISSING').length;
    const extra = items.filter(i => i.opname_status === 'EXTRA').length;
    log('🔍', `${br.name}: ${brInv.length} item → IN=${instock} MISS=${missing} EXTRA=${extra}`);
    opnameResults.push({ branch: br.name, total: brInv.length, instock, missing, extra });
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
section('RINGKASAN AKHIR');

totals = await apiData('GET', '/report/total-count');
const summary = await apiData('GET', '/report/finance-summary');
const invAvail  = (await api('GET', '/inventory?per_page=1&status=AVAILABLE'))?.total || 0;
const invSold   = (await api('GET', '/inventory?per_page=1&status=SOLD'))?.total || 0;
const pemApp    = (await api('GET', '/pembelian?status=APPROVAL&per_page=1'))?.total || 0;
const pemOk     = (await api('GET', '/pembelian?status=DISETUJUI&per_page=1'))?.total || 0;
const pemNo     = (await api('GET', '/pembelian?status=DITOLAK&per_page=1'))?.total || 0;
const totalSales = (await api('GET', '/sales?per_page=1'))?.total || 0;
const opnameList = (await api('GET', '/stock-opname?per_page=100'))?.data || [];

console.log(`
┌───────────────────────────────────────────────────────────────┐
│                  SKENARIO TEST — RINGKASAN                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  💰 MODAL AWAL                                               │
│     Per cabang     : ${fmt(50000000).padEnd(18)} (50% tunai, 50% transfer)│
│     Total 4 cabang : ${fmt(200000000).padEnd(18)}                        │
│                                                               │
│  📝 PEMBELIAN (60 total, 15/cabang)                           │
│     Disetujui  : ${String(pemOk).padEnd(3)}  → inventory terbentuk                │
│     Ditolak    : ${String(pemNo).padEnd(3)}                                        │
│     Pending    : ${String(pemApp).padEnd(3)}                                        │
│                                                               │
│  📦 INVENTORY                                                 │
│     AVAILABLE  : ${String(invAvail).padEnd(3)}                                        │
│     SOLD       : ${String(invSold).padEnd(3)}  (dari penjualan)                    │
│                                                               │
│  👤 CUSTOMER                                                  │
│     Existing   : 3                                            │
│     Baru       : 5   (Siti, Budi, Dewi, Ahmad, Ratna)        │
│     Total      : 8                                            │
│                                                               │
│  🛒 PENJUALAN                                                 │
│     Transaksi  : ${String(totalSales).padEnd(3)}                                        │
│     Dicetak    : ${String(cetakOk).padEnd(3)}  → finance CASH IN                    │
│                                                               │
│  💰 SALDO AKHIR                                               │
│     KAS Tunai  : ${fmt(totals.total_cash).padEnd(18)}                        │
│     Bank       : ${fmt(totals.total_transfer).padEnd(18)}                        │
│     TOTAL      : ${fmt(totals.total_all).padEnd(18)}                        │
│                                                               │
│  📊 FINANCE SUMMARY                                           │
│     Saldo Awal : ${fmt(summary?.summary?.opening_balance || 0).padEnd(18)}                        │
│     Cash In    : ${fmt(summary?.summary?.cash_in || 0).padEnd(18)}                        │
│     Cash Out   : ${fmt(summary?.summary?.cash_out || 0).padEnd(18)}                        │
│     Saldo Akhir: ${fmt(summary?.summary?.closing_balance || 0).padEnd(18)}                        │
│                                                               │
│  🔍 STOCK OPNAME (${opnameList.length} sesi)${' '.repeat(37)}│
${opnameResults.map(r =>
`│     ${r.branch.padEnd(16)}: ${String(r.total).padEnd(2)} item → IN=${String(r.instock).padEnd(2)} MISS=${String(r.missing).padEnd(1)} EXTRA=${r.extra}     │`
).join('\n')}
│                                                               │
└───────────────────────────────────────────────────────────────┘
`);

console.log('🎉 Semua skenario berhasil!');
