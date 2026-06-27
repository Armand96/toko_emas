/**
 * DEEP FLOW TEST — semua fitur & alur bisnis, dengan ASSERTION di tiap langkah.
 * Bertindak seperti user nyata sesuai role (Kasir input, Owner approve).
 * Fokus: kebenaran fungsional (state machine, finance, inventory, report),
 * BUKAN security API (RBAC by design FE-only).
 *
 * Run: node _flowtest.mjs
 */
const BASE = 'http://127.0.0.1:8000/api';
const ACC = {
    super: { username: 'tokoemas', password: 'tokoemas' },
    owner: { username: 'owner', password: 'password' },
    kasirJkt: { username: 'kasirjkt', password: 'password' },
    kasirBgr: { username: 'kasirbgr', password: 'password' },
};
const T = {};
let pass = 0, fail = 0;
const fails = [];

function check(cond, label, detail) {
    if (cond) { pass++; console.log(`  ✓ ${label}`); }
    else { fail++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? `  →  ${detail}` : ''}`); }
}
function info(label) { console.log(`  i ${label}`); }
function section(t) { console.log(`\n${'═'.repeat(72)}\n  ${t}\n${'═'.repeat(72)}`); }

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
    let json = null; try { json = await res.json(); } catch {}
    return { status: res.status, json };
}
const dataOf = (r) => r.json?.data ?? r.json;
const listOf = (r) => r.json?.data ?? (Array.isArray(r.json) ? r.json : []);
const num = (x) => Number(x || 0);

async function totals() { return dataOf(await api(T.super, 'GET', '/report/total-count')); }

async function run() {
    section('LOGIN');
    for (const [k, a] of Object.entries(ACC)) { T[k] = await login(a); check(!!T[k], `login ${k}`); }

    // ════════════════════════════════════════════════════════════════
    section('FITUR: MASTER DATA CRUD');

    // Customer create + search + filter status
    const custName = 'QA Customer ' + Date.now();
    const mkCust = await api(T.kasirJkt, 'POST', '/customers', { customer_name: custName, address: 'Jl. Test', phone_number: '081200000001', is_active: 1 });
    const custId = dataOf(mkCust)?.id;
    check(!!custId, 'Customer baru dibuat', `status ${mkCust.status}`);

    const custSearch = await api(T.super, 'GET', `/customers?customer_name=${encodeURIComponent('QA Customer')}&per_page=50`);
    check(listOf(custSearch).some(c => c.id === custId), 'Customer search by name menemukan data');

    const custFilterActive = await api(T.super, 'GET', '/customers?is_active=1&per_page=50');
    check(custFilterActive.status === 200 && listOf(custFilterActive).every(c => c.is_active == 1), 'Customer filter is_active=1 konsisten');

    // sales_count utk badge member
    const custDetail = listOf(await api(T.super, 'GET', `/customers?customer_name=${encodeURIComponent(custName)}`))[0];
    check(custDetail && ('sales_count' in custDetail), 'Customer punya sales_count (badge member)', custDetail ? JSON.stringify(Object.keys(custDetail)) : 'no data');

    // Supplier filter aktif
    const supActive = await api(T.super, 'GET', '/suppliers?is_active=1&per_page=50');
    check(supActive.status === 200 && listOf(supActive).every(s => s.is_active == 1), 'Supplier filter aktif konsisten');

    // Product create (barcode auto, multi-branch tidak gandakan produk)
    const cat = listOf(await api(T.super, 'GET', '/categories?per_page=50')).find(c => c.parent_id) || {};
    const parentCatId = cat.parent_id || cat.id;
    const mkProd = await form(T.super, '/products', {
        product_name: 'QA Produk ' + Date.now(), category_id: parentCatId, subcategory_id: cat.id || 0,
        'branch_id[0]': 1, 'branch_id[1]': 2, is_active: 1, description: 'produk qa',
    });
    // FormData array trick di atas mungkin tak terbaca; coba cara lain kalau gagal
    let prodId = dataOf(mkProd)?.id;
    if (!prodId) {
        // kirim branch_id sebagai JSON array via endpoint JSON
        const mk2 = await api(T.super, 'POST', '/products', { product_name: 'QA Produk JSON ' + Date.now(), category_id: parentCatId, subcategory_id: cat.id || 0, branch_id: [1, 2], is_active: 1, description: 'qa json' });
        prodId = dataOf(mk2)?.id;
        info(`product create via JSON status=${mk2.status} id=${prodId}`);
    }
    if (prodId) {
        const prodDetail = dataOf(await api(T.super, 'GET', `/products/${prodId}`));
        const branchCount = (prodDetail?.branches || []).length;
        check(branchCount === 2, 'Produk multi-cabang = 1 produk dgn 2 branch (tidak gandakan)', `branches=${branchCount}`);
        check(!!prodDetail?.barcode, 'Produk barcode ter-generate', prodDetail?.barcode);
    } else {
        info('Produk create gagal, skip verifikasi produk');
    }

    // ════════════════════════════════════════════════════════════════
    section('FLOW 1: PEMBELIAN → APPROVAL → INVENTORY + FINANCE (Tunai & Transfer)');

    const beforeT = await totals();
    const prods = listOf(await api(T.super, 'GET', '/products?per_page=100'));
    const pJkt = prods.find(p => (p.branches || []).some(b => b.branch_id === 1));
    check(!!pJkt, 'Ada produk utk cabang Jakarta');

    // Kasir buat 1 batch berisi 2 item: 1 TUNAI + 1 TRANSFER
    const items = [
        { branch_id: 1, product_id: pJkt.id, category_id: pJkt.category_id, subcategory_id: pJkt.subcategory_id || 0, supplier_id: 2, barcode: pJkt.barcode, serial_number: 'QA-T-' + Date.now(), berat: 4.5, karat: 22, modal: 1000000, jual: 1300000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null },
        { branch_id: 1, product_id: pJkt.id, category_id: pJkt.category_id, subcategory_id: pJkt.subcategory_id || 0, supplier_id: 2, barcode: pJkt.barcode, serial_number: 'QA-F-' + Date.now(), berat: 6.0, karat: 24, modal: 2000000, jual: 2500000, tipe_pembayaran: 'TRANSFER', bank_cabang_id: 1 },
    ];
    const mkPemb = await api(T.kasirJkt, 'POST', '/pembelian', { data: items });
    const pembIds = (dataOf(mkPemb) || []).map(p => p.id);
    check(pembIds.length === 2, 'Kasir buat pembelian 2 item (1 batch)', `ids=${pembIds}`);

    // Verifikasi status awal APPROVAL & batch sama
    const pembList = listOf(await api(T.super, 'GET', '/pembelian?per_page=10'));
    const myPemb = pembList.filter(p => pembIds.includes(p.id));
    check(myPemb.every(p => p.status === 'APPROVAL'), 'Pembelian status awal = APPROVAL');
    check(new Set(myPemb.map(p => p.batch)).size === 1, 'Kedua item 1 batch yang sama', `batches=${[...new Set(myPemb.map(p => p.batch))]}`);

    // Owner approve 1 item, tolak 1 item
    const approveId = pembIds[0], rejectId = pembIds[1];
    const ap = await api(T.owner, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: [approveId] });
    const rj = await api(T.owner, 'POST', '/update-pembelian', { status: 'DITOLAK', pembelian_ids: [rejectId], note: 'karat tidak sesuai' });
    check(ap.status < 300 && rj.status < 300, 'Owner approve 1 & tolak 1');

    // Inventory hanya utk yg disetujui
    const invList = listOf(await api(T.super, 'GET', '/inventory?per_page=200&branch_id=1&status=AVAILABLE'));
    const invApproved = invList.filter(i => i.pembelian_id === approveId);
    const invRejected = invList.filter(i => i.pembelian_id === rejectId);
    check(invApproved.length === 1, 'Inventory terbentuk utk pembelian disetujui (1)', `count=${invApproved.length}`);
    check(invRejected.length === 0, 'Inventory TIDAK terbentuk utk pembelian ditolak', `count=${invRejected.length}`);

    // Inventory code format {barcode}-{4digit}
    const invCode = invApproved[0]?.inventory_code || '';
    check(/-\d{4}$/.test(invCode) && invCode.startsWith(pJkt.barcode), 'Format inventory_code {barcode}-NNNN', invCode);

    // Finance CASH OUT bertambah (modal item disetujui = 1.000.000 tunai)
    const afterT = await totals();
    const cashDelta = num(beforeT.total_cash) - num(afterT.total_cash);
    check(cashDelta === 1000000, 'Saldo TUNAI berkurang = modal item tunai disetujui (1.000.000)', `delta=${cashDelta}`);
    // Item transfer ditolak → tidak ada cash out transfer
    const transferDelta = num(beforeT.total_transfer) - num(afterT.total_transfer);
    check(transferDelta === 0, 'Saldo TRANSFER tidak berubah (item transfer ditolak)', `delta=${transferDelta}`);

    // ════════════════════════════════════════════════════════════════
    section('FLOW 2: PENJUALAN → APPROVAL → CETAK KWITANSI → INVENTORY SOLD + FINANCE CASH IN');

    const sellTarget = invApproved[0];
    const beforeSale = await totals();
    const mkSale = await api(T.kasirJkt, 'POST', '/sales', {
        customer_id: custId, branch_id: 1, payment_type: 'TUNAI',
        nominal_paid: num(sellTarget.jual) + 100000, exchange: 100000,
        item: [{ inventory_code: sellTarget.inventory_code, product_id: sellTarget.product_id, price: num(sellTarget.jual) }],
    });
    check(mkSale.status < 300, 'Kasir buat penjualan', `status ${mkSale.status}`);

    const sale = listOf(await api(T.super, 'GET', '/sales?per_page=5'))[0];
    check(sale?.approval_status === 'APPROVAL', 'Penjualan status awal = APPROVAL', sale?.approval_status);
    check(sale?.order_id?.startsWith('ORD-'), 'Order ID format ORD-YYYYMMDD-NNNN', sale?.order_id);
    check(num(sale?.grand_total) === num(sellTarget.jual), 'Grand total = harga jual item', `${sale?.grand_total} vs ${sellTarget.jual}`);

    // Sebelum cetak: inventory masih AVAILABLE, belum ada cash in
    let invMid = dataOf(await api(T.super, `GET`, `/inventory/${sellTarget.id}`));
    check(invMid?.status === 'AVAILABLE', 'Sebelum kwitansi: inventory masih AVAILABLE (boleh cancel)', invMid?.status);

    // Owner approve → DISETUJUI
    const apSale = await api(T.owner, 'PUT', '/update-sales', { penjualan_id: sale.id, status: 'DISETUJUI' });
    check(apSale.status < 300, 'Owner setujui penjualan');
    invMid = dataOf(await api(T.super, `GET`, `/inventory/${sellTarget.id}`));
    check(invMid?.status === 'AVAILABLE', 'Setelah DISETUJUI (belum cetak): inventory masih AVAILABLE, belum SOLD', invMid?.status);

    // Cetak kwitansi → SOLD + cash in
    const cetak = await api(T.owner, 'PUT', '/update-sales', { penjualan_id: sale.id, status: 'CETAK KWITANSI' });
    check(cetak.status < 300, 'Cetak kwitansi');
    const invSold = dataOf(await api(T.super, `GET`, `/inventory/${sellTarget.id}`));
    check(invSold?.status === 'SOLD', 'Setelah cetak: inventory jadi SOLD', invSold?.status);

    const afterSale = await totals();
    const cashIn = num(afterSale.total_cash) - num(beforeSale.total_cash);
    check(cashIn === num(sellTarget.jual), 'Saldo TUNAI bertambah = harga jual (cash in)', `delta=${cashIn} vs ${sellTarget.jual}`);

    // ════════════════════════════════════════════════════════════════
    section('FLOW 3: TRANSFER ITEM antar cabang');
    // Buat inventory baru di Jakarta dulu utk ditransfer
    const mkP2 = await api(T.kasirJkt, 'POST', '/pembelian', { data: [{ branch_id: 1, product_id: pJkt.id, category_id: pJkt.category_id, subcategory_id: pJkt.subcategory_id || 0, supplier_id: 2, barcode: pJkt.barcode, serial_number: 'QA-TR-' + Date.now(), berat: 3, karat: 22, modal: 500000, jual: 700000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null }] });
    const p2Id = (dataOf(mkP2) || [])[0]?.id;
    await api(T.owner, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: [p2Id] });
    const trItem = listOf(await api(T.super, 'GET', '/inventory?per_page=200&branch_id=1&status=AVAILABLE')).find(i => i.pembelian_id === p2Id);
    check(!!trItem, 'Inventory baru utk transfer tersedia di Jakarta');

    const mkTrf = await api(T.kasirJkt, 'POST', '/transfer-item', { branch_source_id: 1, branch_dest_id: 2, item: [{ inventory_code: trItem.inventory_code, product_id: trItem.product_id }] });
    check(mkTrf.status < 300, 'Kasir buat transfer Jakarta→Bogor');
    let trInv = dataOf(await api(T.super, `GET`, `/inventory/${trItem.id}`));
    check(trInv?.status === 'TRANSIT', 'Item jadi TRANSIT setelah pengajuan transfer', trInv?.status);

    const trf = listOf(await api(T.super, 'GET', '/transfer-item?per_page=5'))[0];
    await api(T.owner, 'PUT', '/update-transfer-item', { transfer_item_id: trf.id, status: 'DISETUJUI' });
    trInv = dataOf(await api(T.super, `GET`, `/inventory/${trItem.id}`));
    check(trInv?.status === 'AVAILABLE' && trInv?.branch_id === 2, 'Transfer disetujui: item pindah ke Bogor & AVAILABLE', `status=${trInv?.status} branch=${trInv?.branch_id}`);

    // ════════════════════════════════════════════════════════════════
    section('FLOW 4: REMOVE ITEM — HILANG (approve), REPAIR (approve→return), TOLAK');
    // Siapkan 3 inventory di Jakarta
    const mkP3 = await api(T.kasirJkt, 'POST', '/pembelian', { data: [0, 1, 2].map(i => ({ branch_id: 1, product_id: pJkt.id, category_id: pJkt.category_id, subcategory_id: pJkt.subcategory_id || 0, supplier_id: 2, barcode: pJkt.barcode, serial_number: `QA-RM-${Date.now()}-${i}`, berat: 3, karat: 22, modal: 400000, jual: 600000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null })) });
    const p3Ids = (dataOf(mkP3) || []).map(p => p.id);
    await api(T.owner, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: p3Ids });
    const freshInv = listOf(await api(T.super, 'GET', '/inventory?per_page=200&branch_id=1&status=AVAILABLE')).filter(i => p3Ids.includes(i.pembelian_id));
    check(freshInv.length === 3, '3 inventory baru utk remove test', `count=${freshInv.length}`);

    // HILANG approve
    const lost = freshInv[0];
    await api(T.kasirJkt, 'POST', '/remove-item', { branch_id: 1, jenis: 'HILANG', note: 'hilang saat cek rutin', item: [{ inventory_code: lost.inventory_code, product_id: lost.product_id }] });
    let rmv = listOf(await api(T.super, 'GET', '/remove-item?per_page=5'))[0];
    await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'DISETUJUI' });
    check(dataOf(await api(T.super, `GET`, `/inventory/${lost.id}`))?.status === 'LOST', 'Remove HILANG disetujui → inventory LOST');

    // REPAIR approve → return
    const rep = freshInv[1];
    await api(T.kasirJkt, 'POST', '/remove-item', { branch_id: 1, jenis: 'REPAIR', note: 'perlu poles', item: [{ inventory_code: rep.inventory_code, product_id: rep.product_id }] });
    rmv = listOf(await api(T.super, 'GET', '/remove-item?per_page=5'))[0];
    await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'DISETUJUI' });
    check(dataOf(await api(T.super, `GET`, `/inventory/${rep.id}`))?.status === 'REPAIR', 'Remove REPAIR disetujui → inventory REPAIR');
    await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'RETURN', note: 'selesai diperbaiki' });
    check(dataOf(await api(T.super, `GET`, `/inventory/${rep.id}`))?.status === 'AVAILABLE', 'Remove REPAIR RETURN → inventory AVAILABLE lagi');

    // TOLAK
    const keep = freshInv[2];
    await api(T.kasirJkt, 'POST', '/remove-item', { branch_id: 1, jenis: 'HILANG', note: 'lapor hilang', item: [{ inventory_code: keep.inventory_code, product_id: keep.product_id }] });
    rmv = listOf(await api(T.super, 'GET', '/remove-item?per_page=5'))[0];
    await api(T.owner, 'PUT', '/update-remove-item', { remove_id: rmv.id, status: 'DITOLAK', note: 'ketemu lagi' });
    check(dataOf(await api(T.super, `GET`, `/inventory/${keep.id}`))?.status === 'AVAILABLE', 'Remove DITOLAK → inventory tetap AVAILABLE');

    // ════════════════════════════════════════════════════════════════
    section('FLOW 5: STOCK OPNAME');
    const opnInv = listOf(await api(T.super, 'GET', '/inventory?per_page=200&branch_id=1&status=AVAILABLE'));
    const scanItems = opnInv.map(i => ({ inventory_code: i.inventory_code, product_id: i.product_id, last_status: i.status, opname_status: 'INSTOCK' }));
    const mkOpn = await api(T.kasirJkt, 'POST', '/stock-opname', { branch_id: 1, item: scanItems });
    check(mkOpn.status < 300, 'Stock opname dibuat');
    const opn = listOf(await api(T.super, 'GET', '/stock-opname?per_page=5'))[0];
    check(opn?.kode_sesi?.includes('OPN-'), 'Kode sesi opname format OPN-...', opn?.kode_sesi);
    check(num(opn?.in_stock) === scanItems.length, 'in_stock = jumlah item discan', `${opn?.in_stock} vs ${scanItems.length}`);
    check(opn?.status === 'SESUAI', 'Status opname SESUAI (semua instock = total)', `${opn?.status} (total=${opn?.total_item})`);

    // ════════════════════════════════════════════════════════════════
    section('FLOW 6: LAPORAN konsisten dgn data');
    const finSummary = dataOf(await api(T.super, 'GET', '/report/finance-summary'));
    check(finSummary?.summary, 'Finance summary endpoint OK');
    const tc = await totals();
    const computedClosing = num(finSummary?.summary?.opening_balance) + num(finSummary?.summary?.cash_in) - num(finSummary?.summary?.cash_out);
    check(num(finSummary?.summary?.closing_balance) === computedClosing, 'Closing = opening + cashin - cashout', `${finSummary?.summary?.closing_balance} vs ${computedClosing}`);

    const invSummary = await api(T.super, 'GET', '/report/inventory-summary');
    check(invSummary.status === 200, 'Inventory summary endpoint OK', invSummary.status);
    const salesSummary = await api(T.super, 'GET', '/report/sales-summary');
    check(salesSummary.status === 200, 'Sales summary endpoint OK', salesSummary.status);
    const pembReport = await api(T.super, 'GET', '/report/pembelian-detail?per_page=5');
    check(pembReport.status === 200, 'Pembelian report endpoint OK', pembReport.status);
    const custReport = await api(T.super, 'GET', '/report/customer-count');
    check(custReport.status === 200, 'Customer report endpoint OK', custReport.status);

    // Dashboard
    const dashToday = await api(T.super, 'GET', '/dashboard/data-today');
    check(dashToday.status === 200, 'Dashboard data-today OK', dashToday.status);
    const dashAction = await api(T.owner, 'GET', '/dashboard/take-action-data');
    check(dashAction.status === 200, 'Dashboard take-action OK', dashAction.status);

    // ════════════════════════════════════════════════════════════════
    section('RINGKASAN FLOW TEST');
    console.log(`\n  PASS: ${pass}   FAIL: ${fail}   TOTAL: ${pass + fail}`);
    if (fails.length) {
        console.log('\n  --- GAGAL ---');
        fails.forEach((f, i) => console.log(`  ${i + 1}. ${f.label}${f.detail ? `  (${f.detail})` : ''}`));
    } else {
        console.log('\n  🎉 Semua assertion flow lulus!');
    }
}
run().catch(e => { console.error('FATAL', e); process.exit(1); });
