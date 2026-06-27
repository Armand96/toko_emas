/**
 * DEEP TEST — RBAC enforcement + business-logic edge cases (BE/API layer)
 *
 * Tests whether the backend enforces role/branch restrictions, validates
 * state transitions, and guards against invalid input. FE enforces RBAC
 * cosmetically; this probes whether BE does too.
 *
 * Run: bun run _deeptest.mjs   (or: node _deeptest.mjs)
 * Prereq: php artisan serve running; test users seeded (_seed_test_users.php)
 */

const BASE = 'http://127.0.0.1:8000/api';

const ACCOUNTS = {
    super: { username: 'tokoemas', password: 'tokoemas' },
    owner: { username: 'owner', password: 'password' },
    pic: { username: 'pic', password: 'password' },
    kasirJkt: { username: 'kasirjkt', password: 'password' },
    kasirBgr: { username: 'kasirbgr', password: 'password' },
    kasirOff: { username: 'kasironaktif', password: 'password' },
};

const tokens = {};
const findings = [];
let passCount = 0, failCount = 0;

function rec(severity, area, expected, actual, detail) {
    findings.push({ severity, area, expected, actual, detail });
    const tag = severity === 'PASS' ? '  ✓' : (severity === 'INFO' ? '  i' : `  ✗ [${severity}]`);
    if (severity === 'PASS') passCount++; else if (severity !== 'INFO') failCount++;
    console.log(`${tag} ${area}`);
    if (severity !== 'PASS') {
        console.log(`       expected: ${expected}`);
        console.log(`       actual  : ${actual}`);
        if (detail) console.log(`       note    : ${detail}`);
    }
}

async function login(acc) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc),
    });
    const json = await res.json();
    return { status: res.status, token: json?.data?.user?.token, user: json?.data?.user, raw: json };
}

async function api(token, method, path, body, isForm = false) {
    const headers = { Authorization: `Bearer ${token}` };
    let payload;
    if (isForm) {
        payload = new FormData();
        for (const [k, v] of Object.entries(body || {})) payload.append(k, v == null ? '' : String(v));
    } else {
        headers['Content-Type'] = 'application/json';
        headers['Accept'] = 'application/json';
        if (body) payload = JSON.stringify(body);
    }
    const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
    let json = null;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, json };
}

function section(t) { console.log(`\n${'═'.repeat(70)}\n  ${t}\n${'═'.repeat(70)}`); }

// ══════════════════════════════════════════════════════════════════════
async function run() {
    section('SETUP: Login semua role');
    for (const [key, acc] of Object.entries(ACCOUNTS)) {
        const r = await login(acc);
        tokens[key] = r.token;
        if (key === 'kasirOff') {
            // Inactive user — should login fail?
            if (r.status === 200 && r.token) {
                rec('HIGH', 'AUTH: inactive user (is_active=0) bisa login', 'login ditolak (401/403)', `login sukses, dapat token`, 'Auth::attempt tidak cek is_active');
            } else {
                rec('PASS', 'AUTH: inactive user ditolak login', '', '');
            }
        } else {
            if (r.token) rec('PASS', `AUTH: login ${key} (role ${r.user?.role_id}, branch ${r.user?.branch_id})`, '', '');
            else rec('HIGH', `AUTH: login ${key} GAGAL`, 'token', JSON.stringify(r.raw));
        }
    }

    // ──────────────────────────────────────────────────────────────────
    section('RBAC-1: BE menolak aksi di luar wewenang role?');

    // Kasir mencoba APPROVE pembelian (harusnya cuma Owner/PIC) — tapi belum ada data,
    // kita uji apakah endpoint memblok berdasar role. Buat 1 pembelian dulu sebagai kasir.
    const prodRes = await api(tokens.super, 'GET', '/products?per_page=100');
    const products = prodRes.json?.data || [];
    const jktProd = products.find(p => (p.branches || []).some(b => b.branch_id === 1)) || products[0];

    // Kasir Jakarta buat pembelian (legit)
    const pembBody = {
        data: [{
            branch_id: 1, product_id: jktProd.id, category_id: jktProd.category_id,
            subcategory_id: jktProd.subcategory_id || 0, supplier_id: 2, barcode: jktProd.barcode,
            serial_number: 'DT-SN-001', berat: 5.5, karat: 24, modal: 1000000, jual: 1300000,
            tipe_pembayaran: 'TUNAI', bank_cabang_id: null,
        }],
    };
    const mkPemb = await api(tokens.kasirJkt, 'POST', '/pembelian', pembBody);
    const pembId = mkPemb.json?.data?.[0]?.id;
    rec(pembId ? 'PASS' : 'INFO', `Kasir buat pembelian (id=${pembId})`, '', mkPemb.status);

    // Kasir mencoba APPROVE pembelian sendiri (harusnya TIDAK boleh — approval = Owner/PIC)
    if (pembId) {
        const kasirApprove = await api(tokens.kasirJkt, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: [pembId] });
        if (kasirApprove.status === 200 || kasirApprove.status === 201) {
            rec('HIGH', 'RBAC BE: Kasir bisa APPROVE pembelian via API', 'ditolak (403)', `sukses (${kasirApprove.status})`, 'Tidak ada role check di PembelianController::changeApproval');
        } else if (kasirApprove.status === 403) {
            rec('PASS', 'RBAC BE: Kasir ditolak approve pembelian', '', '');
        } else {
            rec('MED', 'RBAC BE: Kasir approve pembelian (status lain)', '403', kasirApprove.status, JSON.stringify(kasirApprove.json));
        }
    }

    // Kasir Bogor membaca pembelian cabang Jakarta (cross-branch read)
    const bgrReadJkt = await api(tokens.kasirBgr, 'GET', '/pembelian?branch_id=1&per_page=100');
    const seenJktByBgr = (bgrReadJkt.json?.data || []).some(p => p.branch_id === 1);
    if (seenJktByBgr) {
        rec('HIGH', 'RBAC BE: Kasir Bogor bisa baca pembelian cabang Jakarta', 'data cabang lain tidak terlihat', 'terlihat', 'BE tidak filter branch by user; bergantung pada query FE');
    } else {
        rec('PASS', 'RBAC BE: Kasir Bogor tidak melihat pembelian Jakarta', '', '');
    }

    // Kasir Bogor membaca SEMUA pembelian (tanpa branch filter)
    const bgrReadAll = await api(tokens.kasirBgr, 'GET', '/pembelian?per_page=100');
    const allBranchesSeen = new Set((bgrReadAll.json?.data || []).map(p => p.branch_id));
    rec(allBranchesSeen.size > 1 || allBranchesSeen.has(1) ? 'HIGH' : 'INFO',
        'RBAC BE: Kasir Bogor GET /pembelian tanpa filter melihat cabang lain',
        'hanya branch sendiri', `branch terlihat: [${[...allBranchesSeen].join(',')}]`,
        'BE mengembalikan semua data; isolasi cabang hanya di FE');

    // Kasir mencoba akses master user (administrasi) — harusnya tidak boleh (FE), cek BE
    const kasirUsers = await api(tokens.kasirJkt, 'GET', '/users?per_page=5');
    if (kasirUsers.status === 200) {
        rec('HIGH', 'RBAC BE: Kasir bisa GET /users (data semua user)', 'ditolak (403)', `sukses, ${kasirUsers.json?.total ?? '?'} user`, 'Endpoint user tidak ada proteksi role');
    } else {
        rec('PASS', 'RBAC BE: Kasir ditolak GET /users', '', kasirUsers.status);
    }

    // Kasir mencoba CREATE user (privilege escalation)
    const kasirCreateUser = await api(tokens.kasirJkt, 'POST', '/users', {
        username: 'hacker_' + Date.now(), name: 'Hacker', branch_id: 1, role_id: 1, is_active: 1, password: 'x',
    });
    if (kasirCreateUser.status === 201 || kasirCreateUser.status === 200) {
        rec('CRITICAL', 'RBAC BE: Kasir bisa CREATE user role Super Admin', 'ditolak (403)', `sukses (${kasirCreateUser.status})`, 'Privilege escalation: tidak ada proteksi role di UserController::store');
    } else {
        rec('PASS', 'RBAC BE: Kasir ditolak create user', '', kasirCreateUser.status);
    }

    // Owner mencoba CREATE pembelian (Owner harusnya read-only di transaksi pembelian)
    const ownerCreatePemb = await api(tokens.owner, 'POST', '/pembelian', pembBody);
    if (ownerCreatePemb.status === 200 || ownerCreatePemb.status === 201) {
        rec('MED', 'RBAC BE: Owner bisa CREATE pembelian (FE: read-only)', 'sesuai matrix FE = ditolak', `sukses`, 'FE PermissionStore: owner transaksi.pembelian=READ, tapi BE izinkan');
    } else {
        rec('PASS', 'RBAC BE: Owner ditolak create pembelian', '', ownerCreatePemb.status);
    }

    // ──────────────────────────────────────────────────────────────────
    section('FLOW-1: Pembelian approval → inventory & finance');

    // Approve pembelian (sebagai super)
    if (pembId) {
        const approve = await api(tokens.super, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: [pembId] });
        rec(approve.status < 300 ? 'PASS' : 'HIGH', `Approve pembelian id=${pembId}`, '', approve.status);

        // Verify inventory created
        const inv = await api(tokens.super, 'GET', '/inventory?per_page=100&branch_id=1&status=AVAILABLE');
        const invFromPemb = (inv.json?.data || []).find(i => i.pembelian_id === pembId);
        rec(invFromPemb ? 'PASS' : 'HIGH', `Inventory terbentuk dari pembelian (code=${invFromPemb?.inventory_code})`, 'inventory AVAILABLE', invFromPemb ? 'ada' : 'tidak ada');

        // Re-approve same pembelian (idempotency) — should NOT create duplicate inventory/finance
        const reApprove = await api(tokens.super, 'POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: [pembId] });
        const inv2 = await api(tokens.super, 'GET', '/inventory?per_page=100&branch_id=1&status=AVAILABLE');
        const dupCount = (inv2.json?.data || []).filter(i => i.pembelian_id === pembId).length;
        if (dupCount > 1) {
            rec('HIGH', 'FLOW: Re-approve pembelian membuat inventory DUPLIKAT', '1 inventory', `${dupCount} inventory`, 'changeApproval tidak idempotent untuk DISETUJUI');
        } else {
            rec('PASS', `FLOW: Re-approve tidak duplikat inventory (count=${dupCount})`, '', '');
        }
    }

    // Approve dengan status invalid
    const badStatus = await api(tokens.super, 'POST', '/update-pembelian', { status: 'NGAWUR', pembelian_ids: [pembId || 1] });
    rec(badStatus.status === 422 ? 'PASS' : 'MED', 'VALIDASI: status pembelian invalid ditolak', '422', `${badStatus.status} ${JSON.stringify(badStatus.json?.message||'')}`);

    // ──────────────────────────────────────────────────────────────────
    section('FLOW-2: Penjualan — state machine & idempotency');

    // Buat inventory lain dulu utk dijual
    const invAvail = await api(tokens.super, 'GET', '/inventory?per_page=100&branch_id=1&status=AVAILABLE');
    const sellItem = (invAvail.json?.data || [])[0];
    if (sellItem) {
        const mkSale = await api(tokens.kasirJkt, 'POST', '/sales', {
            customer_id: 2, branch_id: 1, payment_type: 'TUNAI',
            nominal_paid: Number(sellItem.jual) + 50000, exchange: 50000,
            item: [{ inventory_code: sellItem.inventory_code, product_id: sellItem.product_id, price: Number(sellItem.jual) }],
        });
        rec(mkSale.status < 300 ? 'PASS' : 'HIGH', 'Kasir buat penjualan', '', mkSale.status);

        const salesList = await api(tokens.super, 'GET', '/sales?per_page=10');
        const sale = (salesList.json?.data || [])[0];

        if (sale) {
            // Langsung CETAK KWITANSI tanpa DISETUJUI (skip state) — harusnya ditolak
            const skip = await api(tokens.super, 'PUT', '/update-sales', { penjualan_id: sale.id, status: 'CETAK KWITANSI' });
            const invAfter = await api(tokens.super, 'GET', `/inventory/${sellItem.id}`);
            const st = invAfter.json?.data?.status || invAfter.json?.status;
            if (st === 'SOLD') {
                rec('MED', 'FLOW: Penjualan bisa langsung CETAK KWITANSI lewati DISETUJUI', 'harus DISETUJUI dulu', `inventory jadi SOLD, status=${skip.status}`, 'Tidak ada state-machine guard di changeApproval sales');
            } else {
                rec('PASS', `FLOW: Skip-state ditahan (inv status=${st})`, '', '');
            }

            // Double CETAK KWITANSI — buat duplikat finance CASH IN?
            const financeBefore = await api(tokens.super, 'GET', '/finances?per_page=200&type=CASH IN');
            const cinBefore = (financeBefore.json?.data || []).length;
            await api(tokens.super, 'PUT', '/update-sales', { penjualan_id: sale.id, status: 'CETAK KWITANSI' });
            const financeAfter = await api(tokens.super, 'GET', '/finances?per_page=200&type=CASH IN');
            const cinAfter = (financeAfter.json?.data || []).length;
            if (cinAfter > cinBefore) {
                rec('HIGH', 'FLOW: Cetak kwitansi 2x membuat DUPLIKAT finance CASH IN', 'tidak nambah', `+${cinAfter - cinBefore} entry`, 'Tidak ada guard idempotent di CETAK KWITANSI');
            } else {
                rec('PASS', 'FLOW: Cetak kwitansi ulang tidak duplikat finance', '', '');
            }
        }
    }

    // Jual inventory yang TIDAK AVAILABLE (sudah SOLD) — harusnya ditolak
    if (sellItem) {
        const sellSold = await api(tokens.kasirJkt, 'POST', '/sales', {
            customer_id: 2, branch_id: 1, payment_type: 'TUNAI', nominal_paid: 100, exchange: 0,
            item: [{ inventory_code: sellItem.inventory_code, product_id: sellItem.product_id, price: 100 }],
        });
        if (sellSold.status < 300) {
            rec('HIGH', 'FLOW: Bisa membuat penjualan utk inventory yang sudah SOLD', 'ditolak', `sukses (${sellSold.status})`, 'Tidak ada validasi status/ketersediaan inventory saat createTrx');
        } else {
            rec('PASS', 'FLOW: Penjualan inventory SOLD ditolak', '', sellSold.status);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    section('BUG-1: Filter & search backend (NOTES.tsv items)');

    // Sales filter by status (controller pakai approval_status presence tapi baca $request->status)
    const salesFilter = await api(tokens.super, 'GET', '/sales?approval_status=APPROVAL&per_page=50');
    const salesNoMatch = (salesFilter.json?.data || []).some(s => s.approval_status !== 'APPROVAL');
    rec(salesNoMatch ? 'MED' : 'INFO',
        'BUG: Sales filter approval_status (mismatch field di controller)',
        'hanya APPROVAL', salesNoMatch ? 'ada status lain (filter tidak jalan)' : 'cocok / data sedikit',
        'TSalesController::index cek has(approval_status) tapi pakai $request->status');

    // Customer name search di sales (where customer.customer_name → kemungkinan SQL error)
    const custSearch = await api(tokens.super, 'GET', '/sales?customer_name=Aldi&per_page=10');
    if (custSearch.status >= 500) {
        rec('HIGH', 'BUG: Sales search customer_name menyebabkan error 500', '200', custSearch.status, "where('customer.customer_name',...) bukan whereHas");
    } else {
        rec(custSearch.status === 200 ? 'PASS' : 'MED', `BUG: Sales search customer_name (status ${custSearch.status})`, '200', custSearch.status);
    }

    // ──────────────────────────────────────────────────────────────────
    section('BUG-2: Null-pointer / state guards di approval');

    // Transfer approval dengan ID tidak ada → $data null → $data->update crash?
    const trfBad = await api(tokens.super, 'PUT', '/update-transfer-item', { transfer_item_id: 999999, status: 'DISETUJUI' });
    if (trfBad.status >= 500) {
        rec('MED', 'BUG: Approve transfer ID tidak ada → 500 (null pointer)', '404/422', trfBad.status, 'TransferItemController::changeApproval tidak guard null $data');
    } else {
        rec('PASS', `BUG: Approve transfer ID invalid ditangani (status ${trfBad.status})`, '', '');
    }

    // Sales approval dengan ID tidak ada
    const salesBad = await api(tokens.super, 'PUT', '/update-sales', { penjualan_id: 999999, status: 'DISETUJUI' });
    if (salesBad.status >= 500) {
        rec('MED', 'BUG: Approve sales ID tidak ada → 500 (null pointer)', '404/422', salesBad.status, 'TSalesController::changeApproval tidak guard null $data');
    } else {
        rec('PASS', `BUG: Approve sales ID invalid ditangani (status ${salesBad.status})`, '', '');
    }

    // Remove approval: re-approve / status guard (approve item yg sudah ditolak)
    // (butuh data; skip kalau tidak ada)

    // ──────────────────────────────────────────────────────────────────
    section('VALIDASI: Finance & input umum');

    // Finance create tanpa note (note required) sebagai super
    const finNoNote = await api(tokens.super, 'POST', '/finances', {
        branch_id: 1, category_finance_id: 1, bank_cabang_id: 0, type: 'CASH OUT',
        payment_method: 'TUNAI', nominal: 50000,
    }, true);
    rec(finNoNote.status === 422 ? 'PASS' : 'INFO', `VALIDASI: Finance tanpa note (${finNoNote.status})`, '422', finNoNote.status);

    // Finance CASH OUT tanpa attachment (NOTES: attachment mandatory utk cash out) — BE nullable
    const finNoAttach = await api(tokens.super, 'POST', '/finances', {
        branch_id: 1, category_finance_id: 1, bank_cabang_id: 0, type: 'CASH OUT',
        payment_method: 'TUNAI', nominal: 50000, note: 'test no attachment',
    }, true);
    if (finNoAttach.status < 300) {
        rec('INFO', 'VALIDASI: Finance CASH OUT tanpa attachment diterima BE', 'FE-only rule', `sukses (${finNoAttach.status})`, 'attachment nullable di FinanceRequest; mandatory hanya di FE');
    } else {
        rec('INFO', `VALIDASI: Finance CASH OUT tanpa attachment (${finNoAttach.status})`, '', finNoAttach.status);
    }

    // ──────────────────────────────────────────────────────────────────
    section('RINGKASAN');
    console.log(`\n  PASS: ${passCount}   FAIL: ${failCount}   TOTAL CHECK: ${passCount + failCount}`);
    const bySev = {};
    findings.filter(f => f.severity !== 'PASS' && f.severity !== 'INFO').forEach(f => { bySev[f.severity] = (bySev[f.severity] || 0) + 1; });
    console.log('  Findings by severity:', JSON.stringify(bySev));
    console.log('\n  --- DAFTAR TEMUAN (non-PASS) ---');
    findings.filter(f => f.severity !== 'PASS').forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.severity}] ${f.area}`);
    });
}

run().catch(e => { console.error('FATAL', e); process.exit(1); });
