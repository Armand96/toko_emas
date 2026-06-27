/**
 * DEEP TEST 2 — sisa edge case BE: remove-item state guard, transfer
 * same-branch & cross-branch sale, opname trust-client, finance auto-edit guard.
 */
const BASE = 'http://127.0.0.1:8000/api';
const ACC = { super: { username: 'tokoemas', password: 'tokoemas' }, kasirJkt: { username: 'kasirjkt', password: 'password' } };
const findings = [];
function rec(sev, area, exp, act, det) {
    findings.push({ sev, area });
    const tag = sev === 'PASS' ? '  ✓' : (sev === 'INFO' ? '  i' : `  ✗ [${sev}]`);
    console.log(`${tag} ${area}`);
    if (sev !== 'PASS') { console.log(`       expected: ${exp}`); console.log(`       actual  : ${act}`); if (det) console.log(`       note    : ${det}`); }
}
async function login(a) { const r = await fetch(`${BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) }); const j = await r.json(); return j?.data?.user?.token; }
async function api(token, method, path, body) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let json = null; try { json = await res.json(); } catch {}
    return { status: res.status, json };
}
function section(t) { console.log(`\n${'═'.repeat(70)}\n  ${t}\n${'═'.repeat(70)}`); }

async function run() {
    const tSuper = await login(ACC.super);
    const tKasir = await login(ACC.kasirJkt);

    section('SETUP: pastikan ada inventory AVAILABLE di Jakarta & Bogor');
    // Approve beberapa pembelian baru kalau perlu. Ambil yang ada dulu.
    let invJkt = (await api(tSuper, 'GET', '/inventory?per_page=100&branch_id=1&status=AVAILABLE')).json?.data || [];
    console.log(`  inventory AVAILABLE Jakarta: ${invJkt.length}`);

    // Kalau kurang dari 3, buat pembelian + approve
    if (invJkt.length < 3) {
        const prod = ((await api(tSuper, 'GET', '/products?per_page=100')).json?.data || []).find(p => (p.branches || []).some(b => b.branch_id === 1));
        const items = [];
        for (let i = 0; i < 3; i++) items.push({ branch_id: 1, product_id: prod.id, category_id: prod.category_id, subcategory_id: prod.subcategory_id || 0, supplier_id: 2, barcode: prod.barcode, serial_number: `D2-${Date.now()}-${i}`, berat: 3, karat: 22, modal: 500000, jual: 700000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null });
        const mk = await api(tKasir, 'POST', '/pembelian', { data: items });
        const ids = (mk.json?.data || []).map(p => p.id);
        await api(tSuper, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: ids });
        invJkt = (await api(tSuper, 'GET', '/inventory?per_page=100&branch_id=1&status=AVAILABLE')).json?.data || [];
        console.log(`  setelah top-up: ${invJkt.length}`);
    }

    section('REMOVE-1: state guard di remove-item approval');
    const rItem = invJkt[0];
    const mkRemove = await api(tKasir, 'POST', '/remove-item', { branch_id: 1, jenis: 'HILANG', note: 'test guard', item: [{ inventory_code: rItem.inventory_code, product_id: rItem.product_id }] });
    const rmvId = ((await api(tSuper, 'GET', '/remove-item?per_page=1')).json?.data || [])[0]?.id;
    // Tolak dulu
    await api(tSuper, 'PUT', '/update-remove-item', { remove_id: rmvId, status: 'DITOLAK', note: 'ditolak' });
    let invSt = (await api(tSuper, `GET`, `/inventory/${rItem.id}`)).json?.data?.status;
    rec(invSt === 'AVAILABLE' ? 'PASS' : 'INFO', `Remove DITOLAK → inventory tetap AVAILABLE (status=${invSt})`, '', '');
    // Sekarang RE-APPROVE removal yang sudah DITOLAK (harusnya tidak boleh)
    const reApprove = await api(tSuper, 'PUT', '/update-remove-item', { remove_id: rmvId, status: 'DISETUJUI' });
    invSt = (await api(tSuper, `GET`, `/inventory/${rItem.id}`)).json?.data?.status;
    if (invSt === 'LOST') {
        rec('HIGH', 'REMOVE: removal yang sudah DITOLAK bisa di-APPROVE ulang → item jadi LOST', 'ditolak / tetap DITOLAK', `status=${reApprove.status}, inv=LOST`, 'RemoveItemController::changeApproval tidak cek status saat ini (tidak ada state guard)');
    } else {
        rec('PASS', `REMOVE: re-approve removal DITOLAK ditahan (inv=${invSt})`, '', '');
    }

    section('REMOVE-2: RETURN bisa "menghidupkan" item LOST');
    // Item sekarang LOST (dari atas). Coba RETURN → harusnya hanya boleh utk REPAIR.
    const ret = await api(tSuper, 'PUT', '/update-remove-item', { remove_id: rmvId, status: 'RETURN', note: 'return paksa' });
    invSt = (await api(tSuper, `GET`, `/inventory/${rItem.id}`)).json?.data?.status;
    if (invSt === 'AVAILABLE') {
        rec('MED', 'REMOVE: status RETURN pada removal HILANG mengembalikan item LOST → AVAILABLE', 'RETURN hanya valid utk REPAIR', `inv=AVAILABLE (status ${ret.status})`, 'Tidak ada validasi jenis/status; RETURN selalu set AVAILABLE');
    } else {
        rec('PASS', `REMOVE: RETURN tidak resurrect LOST (inv=${invSt})`, '', '');
    }

    section('TRANSFER-1: transfer ke cabang yang sama (source == dest)');
    const tItem = invJkt[1];
    const sameTransfer = await api(tKasir, 'POST', '/transfer-item', { branch_source_id: 1, branch_dest_id: 1, item: [{ inventory_code: tItem.inventory_code, product_id: tItem.product_id }] });
    if (sameTransfer.status < 300) {
        rec('MED', 'TRANSFER: source == dest (cabang sama) diterima', 'ditolak (422)', `sukses (${sameTransfer.status})`, 'TransferItemRequest tidak cek branch_source != branch_dest');
    } else {
        rec('PASS', `TRANSFER: source==dest ditolak (${sameTransfer.status})`, '', '');
    }

    section('TRANSFER-2: jual inventory yang sedang TRANSIT');
    // Item tItem sekarang TRANSIT (karena transfer di atas, kalaupun source==dest tetap di-set TRANSIT)
    invSt = (await api(tSuper, `GET`, `/inventory/${tItem.id}`)).json?.data?.status;
    console.log(`  status ${tItem.inventory_code} = ${invSt}`);
    if (invSt === 'TRANSIT') {
        const sellTransit = await api(tKasir, 'POST', '/sales', { customer_id: 2, branch_id: 1, payment_type: 'TUNAI', nominal_paid: 100, exchange: 0, item: [{ inventory_code: tItem.inventory_code, product_id: tItem.product_id, price: 100 }] });
        if (sellTransit.status < 300) {
            rec('HIGH', 'SALE: bisa menjual inventory yang sedang TRANSIT', 'ditolak', `sukses (${sellTransit.status})`, 'Tidak ada cek status inventory saat penjualan');
        } else {
            rec('PASS', `SALE: jual item TRANSIT ditolak (${sellTransit.status})`, '', '');
        }
    } else {
        rec('INFO', `SALE: item tidak TRANSIT (${invSt}), skip cek jual-transit`, '', '');
    }

    section('SALE-3: jual inventory cabang lain (branch mismatch)');
    // Kasir Jakarta jual item dengan branch_id=2 (Bogor) di payload
    const otherItem = invJkt[2];
    if (otherItem) {
        const crossSale = await api(tKasir, 'POST', '/sales', { customer_id: 2, branch_id: 2, payment_type: 'TUNAI', nominal_paid: 100, exchange: 0, item: [{ inventory_code: otherItem.inventory_code, product_id: otherItem.product_id, price: 100 }] });
        if (crossSale.status < 300) {
            rec('MED', 'SALE: header branch_id=2 tapi item milik cabang 1 (mismatch) diterima', 'konsistensi cabang divalidasi', `sukses (${crossSale.status})`, 'Tidak ada validasi item.branch == header.branch');
        } else {
            rec('PASS', `SALE: branch mismatch ditolak (${crossSale.status})`, '', '');
        }
    }

    section('OPNAME: server percaya opname_status dari client (EXTRA palsu / kode ngawur)');
    const opn = await api(tKasir, 'POST', '/stock-opname', { branch_id: 1, item: [{ inventory_code: 'KODE-NGAWUR-XYZ', product_id: 1, last_status: 'AVAILABLE', opname_status: 'EXTRA', note: 'kode tidak ada di DB' }] });
    if (opn.status < 300) {
        rec('MED', 'OPNAME: kode tidak ada di DB diterima sebagai EXTRA (tanpa validasi)', 'kode invalid ditolak / tidak jadi EXTRA', `sukses (${opn.status})`, 'NOTES.tsv: kode ngawur jangan masuk EXTRA. BE percaya client; validasi hanya di FE');
    } else {
        rec('PASS', `OPNAME: kode ngawur ditolak (${opn.status})`, '', '');
    }

    section('FINANCE: edit transaksi otomatis (is_auto) ditolak?');
    const autoFin = ((await api(tSuper, 'GET', '/finances?per_page=50')).json?.data || []).find(f => f.is_auto);
    if (autoFin) {
        const editAuto = await api(tSuper, 'PUT', `/finances/${autoFin.id}`, { branch_id: autoFin.branch_id, category_finance_id: autoFin.category_finance_id, bank_cabang_id: autoFin.bank_cabang_id || 0, type: autoFin.type, payment_method: autoFin.payment_method, nominal: '999', note: 'hack' });
        rec(editAuto.status === 422 ? 'PASS' : 'MED', `FINANCE: edit is_auto ditolak (${editAuto.status})`, '422', editAuto.status, editAuto.status === 422 ? '' : 'Guard is_auto seharusnya tolak');
    } else {
        rec('INFO', 'FINANCE: tidak ada transaksi is_auto utk diuji', '', '');
    }

    section('RINGKASAN TEST 2');
    const non = findings.filter(f => f.sev !== 'PASS' && f.sev !== 'INFO');
    console.log(`\n  non-PASS findings: ${non.length}`);
    non.forEach((f, i) => console.log(`  ${i + 1}. [${f.sev}] ${f.area}`));
}
run().catch(e => { console.error('FATAL', e); process.exit(1); });
