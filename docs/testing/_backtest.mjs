/**
 * BACKTEST — Toko Emas, full business flow dengan REKONSILIASI angka.
 *
 * Prinsip: setiap rupiah & setiap item harus terhitung. Skrip melacak
 * "expected" (dari aksi yang kita lakukan) lalu membandingkan dgn "actual"
 * (dari API). Deterministik (tanpa random) supaya hasil reproducible.
 *
 * Prasyarat: DB bersih (migrate:fresh --seed) + user test (owner/kasirjkt/kasirbgr).
 * Run: node _backtest.mjs
 */
const BASE = 'http://127.0.0.1:8000/api';
const ACC = {
    super: { username: 'tokoemas', password: 'tokoemas' },
    owner: { username: 'owner', password: 'password' },
    kasirJkt: { username: 'kasirjkt', password: 'password' },
    kasirBgr: { username: 'kasirbgr', password: 'password' },
};
const T = {};
let pass = 0, fail = 0; const fails = [];

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const num = (x) => Number(x || 0);
function eq(actual, expected, label) {
    const ok = num(actual) === num(expected);
    if (ok) { pass++; console.log(`  ✓ ${label}  = ${typeof expected === 'number' ? fmt(expected) : expected}`); }
    else { fail++; fails.push({ label, expected, actual }); console.log(`  ✗ ${label}  →  expected ${expected}, got ${actual}`); }
    return ok;
}
function ok(cond, label, detail) {
    if (cond) { pass++; console.log(`  ✓ ${label}`); }
    else { fail++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? `  →  ${detail}` : ''}`); }
}
function step(t) { console.log(`\n${'─'.repeat(74)}\n  ▸ ${t}\n${'─'.repeat(74)}`); }
function section(t) { console.log(`\n${'═'.repeat(74)}\n  ${t}\n${'═'.repeat(74)}`); }

async function login(a) { const r = await fetch(`${BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) }); const j = await r.json(); return j?.data?.user?.token; }
async function api(token, method, path, body) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let json = null; try { json = await res.json(); } catch {}
    return { status: res.status, json };
}
async function form(token, path, fields) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v == null ? '' : String(v));
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, body: fd });
    let j = null; try { j = await res.json(); } catch {}
    return { status: res.status, json: j };
}
const dataOf = (r) => r.json?.data ?? r.json;
const listOf = (r) => r.json?.data ?? (Array.isArray(r.json) ? r.json : []);

async function totals() { const d = dataOf(await api(T.super, 'GET', '/report/total-count')); return { all: num(d.total_all), cash: num(d.total_cash), transfer: num(d.total_transfer) }; }
async function invCount(status, branch) { const q = `?per_page=1${status ? `&status=${status}` : ''}${branch ? `&branch_id=${branch}` : ''}`; const r = await api(T.super, 'GET', `/inventory${q}`); return num(r.json?.total); }
async function invByPembelian(pid) { const r = await api(T.super, 'GET', `/inventory?per_page=200&pembelian_id=${pid}`); return listOf(r).filter(i => i.pembelian_id === pid); }
async function availItems(branch) { return listOf(await api(T.super, 'GET', `/inventory?per_page=500&status=AVAILABLE&branch_id=${branch}`)); }
async function invStatus(id) { return dataOf(await api(T.super, `GET`, `/inventory/${id}`))?.status; }

// expected ledger (kita hitung sendiri)
let expCashIn = 0, expCashOut = 0, expCashInTunai = 0, expCashInTf = 0, expCashOutTunai = 0, expCashOutTf = 0;
// stok expected
let expStock = { AVAILABLE: 0, SOLD: 0, TRANSIT: 0, REPAIR: 0, LOST: 0 };

const BRANCHES = [{ id: 1, name: 'Jakarta', bc: 1 }, { id: 2, name: 'Bogor', bc: 4 }];

async function run() {
    section('BACKTEST TOKO EMAS — full flow + rekonsiliasi');
    for (const [k, a] of Object.entries(ACC)) { T[k] = await login(a); }
    ok(Object.values(T).every(Boolean), 'Login semua role');

    // Baseline dari seeder (4 finance Uang Awal). Kita pakai sebagai titik nol.
    const base = await totals();
    console.log(`\n  Baseline (seed): total=${fmt(base.all)} | tunai=${fmt(base.cash)} | transfer=${fmt(base.transfer)}`);
    const baseAvail = await invCount('AVAILABLE');
    expStock.AVAILABLE = baseAvail; // harusnya 0 di DB fresh
    console.log(`  Baseline inventory AVAILABLE: ${baseAvail}`);

    const tokens = { 1: T.kasirJkt, 2: T.kasirBgr };
    const prods = listOf(await api(T.super, 'GET', '/products?per_page=100'));

    // ════════════════════════════════════════════════════════════════
    section('SKENARIO 1 — PEMBELIAN per cabang (Tunai & Transfer), approve sebagian');

    const pembByBranch = {};
    for (const br of BRANCHES) {
        step(`Cabang ${br.name}: buat 4 pembelian (2 tunai, 2 transfer)`);
        const prod = prods.find(p => (p.branches || []).some(b => b.branch_id === br.id));
        ok(!!prod, `${br.name}: ada produk`);
        const items = [];
        for (let i = 0; i < 4; i++) {
            const tunai = i < 2;
            items.push({
                branch_id: br.id, product_id: prod.id, category_id: prod.category_id, subcategory_id: prod.subcategory_id || 0,
                supplier_id: 2, barcode: prod.barcode, serial_number: `BT-${br.name.slice(0, 3)}-${i + 1}`,
                berat: 5, karat: 22, modal: 1000000 * (i + 1), jual: 1000000 * (i + 1) + 300000,
                tipe_pembayaran: tunai ? 'TUNAI' : 'TRANSFER', bank_cabang_id: tunai ? null : br.bc,
            });
        }
        const mk = await api(tokens[br.id], 'POST', '/pembelian', { data: items });
        const created = (dataOf(mk) || []).map((p, i) => ({ ...p, ...items[i] }));
        ok(created.length === 4, `${br.name}: 4 pembelian dibuat`, `got ${created.length}`);
        pembByBranch[br.id] = created;
    }

    // Approve 2 pertama (1 tunai modal 1jt + 1 tunai modal 2jt) tiap cabang, tolak sisanya...
    // supaya deterministik: approve item index 0 (tunai 1jt) & index 2 (transfer 3jt); tolak index 1 & 3.
    const approvedItems = [];
    for (const br of BRANCHES) {
        step(`Cabang ${br.name}: approve #0 (tunai modal 1jt) & #2 (transfer modal 3jt), tolak #1 & #3`);
        const arr = pembByBranch[br.id];
        const approveIds = [arr[0].id, arr[2].id];
        const rejectIds = [arr[1].id, arr[3].id];
        await api(T.owner, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: approveIds });
        await api(T.owner, 'POST', '/update-pembelian', { status: 'DITOLAK', pembelian_ids: rejectIds, note: 'tidak sesuai' });

        // expected ledger: modal item disetujui keluar
        expCashOut += 1000000 + 3000000;
        expCashOutTunai += 1000000;     // item #0 tunai
        expCashOutTf += 3000000;        // item #2 transfer
        expStock.AVAILABLE += 2;

        // verifikasi inventory terbentuk hanya utk approved
        const inv0 = await invByPembelian(arr[0].id);
        const inv2 = await invByPembelian(arr[2].id);
        const inv1 = await invByPembelian(arr[1].id);
        ok(inv0.length === 1 && inv2.length === 1, `${br.name}: 2 inventory terbentuk dari yg disetujui`, `#0=${inv0.length} #2=${inv2.length}`);
        ok(inv1.length === 0, `${br.name}: pembelian ditolak tidak buat inventory`);
        approvedItems.push(...inv0, ...inv2);
    }

    step('Rekonsiliasi finance setelah pembelian');
    let tt = await totals();
    eq(base.cash - tt.cash, expCashOutTunai, 'Total CASH OUT TUNAI (modal item tunai disetujui)');
    eq(base.transfer - tt.transfer, expCashOutTf, 'Total CASH OUT TRANSFER (modal item transfer disetujui)');
    eq(base.all - tt.all, expCashOut, 'Total saldo turun = total modal disetujui');
    eq(await invCount('AVAILABLE'), expStock.AVAILABLE, 'Jumlah inventory AVAILABLE');

    // ════════════════════════════════════════════════════════════════
    section('SKENARIO 2 — PENJUALAN: approve → cetak kwitansi (cash in)');

    // Jual 1 item per cabang (yg modal 1jt tunai, jual = 1.3jt). Customer existing id=2.
    const beforeSale = await totals();
    let salesGrandTotal = 0;
    for (const br of BRANCHES) {
        step(`Cabang ${br.name}: jual 1 item (tunai)`);
        const item = (await availItems(br.id))[0];
        ok(!!item, `${br.name}: ada item utk dijual`);
        const price = num(item.jual);
        const mk = await api(tokens[br.id], 'POST', '/sales', {
            customer_id: 2, branch_id: br.id, payment_type: 'TUNAI',
            nominal_paid: price + 100000, exchange: 100000,
            item: [{ inventory_code: item.inventory_code, product_id: item.product_id, price }],
        });
        ok(mk.status < 300, `${br.name}: penjualan dibuat`);

        const sale = listOf(await api(T.super, `GET`, `/sales?per_page=5&branch_id=${br.id}`))[0];
        eq(sale.grand_total, price, `${br.name}: grand_total = harga jual`);

        // sebelum cetak: AVAILABLE
        ok(await invStatus(item.id) === 'AVAILABLE', `${br.name}: sebelum cetak inventory masih AVAILABLE`);

        await api(T.owner, 'PUT', '/update-sales', { penjualan_id: sale.id, status: 'DISETUJUI' });
        ok(await invStatus(item.id) === 'AVAILABLE', `${br.name}: setelah DISETUJUI belum SOLD (masih bisa cancel)`);

        await api(T.owner, 'PUT', '/update-sales', { penjualan_id: sale.id, status: 'CETAK KWITANSI' });
        ok(await invStatus(item.id) === 'SOLD', `${br.name}: setelah cetak kwitansi → SOLD`);

        expCashIn += price; expCashInTunai += price;
        expStock.AVAILABLE -= 1; expStock.SOLD += 1;
        salesGrandTotal += price;
    }

    step('Rekonsiliasi finance setelah penjualan');
    tt = await totals();
    eq(tt.cash - beforeSale.cash, expCashInTunai, 'Total CASH IN TUNAI = total harga jual');
    eq(await invCount('SOLD'), expStock.SOLD, 'Jumlah inventory SOLD');
    eq(await invCount('AVAILABLE'), expStock.AVAILABLE, 'Jumlah inventory AVAILABLE (berkurang krn terjual)');

    // ════════════════════════════════════════════════════════════════
    section('SKENARIO 3 — TRANSFER ITEM Jakarta → Bogor (approve)');
    {
        const item = (await availItems(1))[0];
        ok(!!item, 'Jakarta: ada item utk transfer');
        await api(T.kasirJkt, 'POST', '/transfer-item', { branch_source_id: 1, branch_dest_id: 2, item: [{ inventory_code: item.inventory_code, product_id: item.product_id }] });
        ok(await invStatus(item.id) === 'TRANSIT', 'Item → TRANSIT setelah pengajuan');
        expStock.AVAILABLE -= 1; expStock.TRANSIT += 1;
        eq(await invCount('TRANSIT'), expStock.TRANSIT, 'Jumlah TRANSIT saat pengajuan');

        const trf = listOf(await api(T.super, 'GET', '/transfer-item?per_page=5'))[0];
        await api(T.owner, 'PUT', '/update-transfer-item', { transfer_item_id: trf.id, status: 'DISETUJUI' });
        const after = dataOf(await api(T.super, `GET`, `/inventory/${item.id}`));
        ok(after?.status === 'AVAILABLE' && after?.branch_id === 2, 'Transfer disetujui → item AVAILABLE di Bogor', `status=${after?.status} branch=${after?.branch_id}`);
        expStock.TRANSIT -= 1; expStock.AVAILABLE += 1;
        eq(await invCount('TRANSIT'), expStock.TRANSIT, 'TRANSIT kembali 0 setelah disetujui');
        ok((await totals()).all === tt.all, 'Transfer tidak mengubah finance (bukan transaksi uang)');
    }

    // ════════════════════════════════════════════════════════════════
    section('SKENARIO 4 — REMOVE ITEM: HILANG(approve), REPAIR(approve→return), TOLAK');
    {
        // Provisi 3 item khusus di Bogor (beli + approve) supaya test deterministik.
        step('Provisi 3 item baru di Bogor (beli + approve) utk remove test');
        const prodBgr = prods.find(p => (p.branches || []).some(b => b.branch_id === 2));
        const buyItems = [0, 1, 2].map(i => ({
            branch_id: 2, product_id: prodBgr.id, category_id: prodBgr.category_id, subcategory_id: prodBgr.subcategory_id || 0,
            supplier_id: 2, barcode: prodBgr.barcode, serial_number: `RMV-BGR-${i + 1}`,
            berat: 3, karat: 22, modal: 500000, jual: 800000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null,
        }));
        const mkBuy = await api(T.kasirBgr, 'POST', '/pembelian', { data: buyItems });
        const buyIds = (dataOf(mkBuy) || []).map(p => p.id);
        await api(T.owner, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: buyIds });
        expCashOut += 3 * 500000; expCashOutTunai += 3 * 500000;
        expStock.AVAILABLE += 3;
        approvedItems.push(...(await Promise.all(buyIds.map(id => invByPembelian(id)))).flat());
        // ambil 3 item yg baru dibuat
        const newInv = listOf(await api(T.super, 'GET', '/inventory?per_page=500&status=AVAILABLE&branch_id=2'))
            .filter(i => buyIds.includes(i.pembelian_id));
        ok(newInv.length === 3, 'Bogor: 3 item baru tersedia utk remove test', `got ${newInv.length}`);
        const [a, b, c] = newInv;

        step('HILANG → LOST');
        await api(T.kasirBgr, 'POST', '/remove-item', { branch_id: 2, jenis: 'HILANG', note: 'hilang', item: [{ inventory_code: a.inventory_code, product_id: a.product_id }] });
        let rmv = listOf(await api(T.super, 'GET', '/remove-item?per_page=5'))[0];
        await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'DISETUJUI' });
        ok(await invStatus(a.id) === 'LOST', 'HILANG disetujui → LOST');
        expStock.AVAILABLE -= 1; expStock.LOST += 1;

        step('REPAIR → REPAIR → RETURN → AVAILABLE');
        await api(T.kasirBgr, 'POST', '/remove-item', { branch_id: 2, jenis: 'REPAIR', note: 'poles', item: [{ inventory_code: b.inventory_code, product_id: b.product_id }] });
        rmv = listOf(await api(T.super, 'GET', '/remove-item?per_page=5'))[0];
        await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'DISETUJUI' });
        ok(await invStatus(b.id) === 'REPAIR', 'REPAIR disetujui → REPAIR');
        await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'RETURN', note: 'selesai' });
        ok(await invStatus(b.id) === 'AVAILABLE', 'REPAIR RETURN → AVAILABLE');

        step('HILANG → DITOLAK (item tetap AVAILABLE)');
        await api(T.kasirBgr, 'POST', '/remove-item', { branch_id: 2, jenis: 'HILANG', note: 'lapor', item: [{ inventory_code: c.inventory_code, product_id: c.product_id }] });
        rmv = listOf(await api(T.super, 'GET', '/remove-item?per_page=5'))[0];
        await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'DITOLAK', note: 'ketemu' });
        ok(await invStatus(c.id) === 'AVAILABLE', 'DITOLAK → tetap AVAILABLE');

        eq(await invCount('LOST'), expStock.LOST, 'Jumlah LOST');
        eq(await invCount('REPAIR'), 0, 'Jumlah REPAIR = 0 (sudah di-return)');
        eq(await invCount('AVAILABLE'), expStock.AVAILABLE, 'Jumlah AVAILABLE konsisten');
    }

    // ════════════════════════════════════════════════════════════════
    section('SKENARIO 5 — STOCK OPNAME per cabang');
    // Top-up 1 item di Jakarta supaya tidak kosong saat opname (Jakarta sudah jual+transfer keluar).
    {
        const prodJkt = prods.find(p => (p.branches || []).some(b => b.branch_id === 1));
        const mk = await api(T.kasirJkt, 'POST', '/pembelian', { data: [{ branch_id: 1, product_id: prodJkt.id, category_id: prodJkt.category_id, subcategory_id: prodJkt.subcategory_id || 0, supplier_id: 2, barcode: prodJkt.barcode, serial_number: `OPN-JKT-1`, berat: 3, karat: 22, modal: 600000, jual: 900000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null }] });
        const id = (dataOf(mk) || [])[0]?.id;
        await api(T.owner, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: [id] });
        expCashOut += 600000; expCashOutTunai += 600000; expStock.AVAILABLE += 1;
        approvedItems.push(...(await invByPembelian(id)));
    }
    for (const br of BRANCHES) {
        const inv = await availItems(br.id);
        if (inv.length === 0) { console.log(`  i ${br.name}: 0 item AVAILABLE, skip opname normal (lihat edge test)`); continue; }
        const items = inv.map(i => ({ inventory_code: i.inventory_code, product_id: i.product_id, last_status: i.status, opname_status: 'INSTOCK' }));
        await api(tokens[br.id], 'POST', '/stock-opname', { branch_id: br.id, item: items });
        const opn = listOf(await api(T.super, `GET`, `/stock-opname?per_page=5&branch_id=${br.id}`))[0];
        ok(opn?.kode_sesi?.startsWith('OPN-'), `${br.name}: kode sesi OPN-`, opn?.kode_sesi);
        eq(opn?.in_stock, items.length, `${br.name}: in_stock = item discan`);
        eq(opn?.total_item, items.length, `${br.name}: total_item = AVAILABLE cabang`);
        ok(opn?.status === 'SESUAI', `${br.name}: status opname SESUAI`, opn?.status);
    }

    step('EDGE: opname dengan item MISSING & EXTRA → status SELISIH');
    {
        // Pakai Bogor: ambil item AVAILABLE, scan 1 sbg MISSING sengaja → harus SELISIH
        const inv = await availItems(2);
        if (inv.length >= 2) {
            const items = inv.map((i, idx) => ({ inventory_code: i.inventory_code, product_id: i.product_id, last_status: i.status, opname_status: idx === 0 ? 'MISSING' : 'INSTOCK' }));
            await api(T.kasirBgr, 'POST', '/stock-opname', { branch_id: 2, item: items });
            const opn = listOf(await api(T.super, `GET`, `/stock-opname?per_page=5&branch_id=2`))[0];
            ok(opn?.status === 'SELISIH', 'Opname dgn 1 MISSING → status SELISIH', opn?.status);
            eq(opn?.missing, 1, 'Opname: missing tercatat = 1');
        } else { console.log('  i skip edge SELISIH (item kurang)'); }
    }

    // ════════════════════════════════════════════════════════════════
    section('REKONSILIASI AKHIR — uang & stok harus balance');
    tt = await totals();
    const expAll = base.all - expCashOut + expCashIn;
    eq(tt.all, expAll, 'Saldo total = baseline − total modal + total penjualan');

    const finSum = dataOf(await api(T.super, 'GET', '/report/finance-summary'));
    const closing = num(finSum?.summary?.opening_balance) + num(finSum?.summary?.cash_in) - num(finSum?.summary?.cash_out);
    eq(num(finSum?.summary?.closing_balance), closing, 'Finance summary: closing = opening + cashin − cashout');

    // stok total = jumlah semua inventory yg pernah dibuat (4 disetujui × 2 cabang... = approvedItems.length)
    const totalInv = approvedItems.length;
    const sumStatus = (await invCount('AVAILABLE')) + (await invCount('SOLD')) + (await invCount('TRANSIT')) + (await invCount('REPAIR')) + (await invCount('LOST'));
    eq(sumStatus, totalInv, 'Total semua status inventory = total item dibuat (tidak ada yg hilang/ganda)');
    eq(await invCount('AVAILABLE'), expStock.AVAILABLE, 'Final AVAILABLE');
    eq(await invCount('SOLD'), expStock.SOLD, 'Final SOLD');
    eq(await invCount('LOST'), expStock.LOST, 'Final LOST');
    eq(await invCount('TRANSIT'), expStock.TRANSIT, 'Final TRANSIT');
    eq(await invCount('REPAIR'), 0, 'Final REPAIR');

    console.log(`\n  Expected stok: ${JSON.stringify(expStock)}`);
    console.log(`  Total inventory dibuat: ${totalInv}`);
    console.log(`  Ledger expected: cashIn=${fmt(expCashIn)} cashOut=${fmt(expCashOut)}`);

    // ════════════════════════════════════════════════════════════════
    section('HASIL BACKTEST');
    console.log(`\n  PASS: ${pass}   FAIL: ${fail}   TOTAL: ${pass + fail}`);
    if (fails.length) {
        console.log('\n  --- TIDAK BALANCE / GAGAL ---');
        fails.forEach((f, i) => console.log(`  ${i + 1}. ${f.label}` + (f.expected !== undefined ? `  (expected ${f.expected}, got ${f.actual})` : (f.detail ? `  (${f.detail})` : ''))));
    } else {
        console.log('\n  🎉 SEMUA BALANCE — flow rapi & konsisten end-to-end.');
    }
}
run().catch(e => { console.error('FATAL', e); process.exit(1); });
