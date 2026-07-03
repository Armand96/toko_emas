/**
 * SKENARIO LENGKAP v2 — Toko Emas
 *
 * 0. Login → dapat token segar (tokoemas/tokoemas)
 * 1. Setup master: 20 cabang, bank cabang, produk berbeda per cabang, user kasir
 * 2. Modal awal: 10jt tunai + 10jt transfer per cabang
 * 3. ~100 pembelian per cabang (produk random, tiap run hasilnya beda)
 * 4. Approve/tolak pembelian secara random per cabang
 * 5. Customer baru + penjualan random tiap cabang
 * 6. Approve penjualan → cetak kwitansi
 * 7. Transfer item antar cabang (random)
 * 8. Remove item: HILANG & REPAIR (random)
 * 9. Stock opname per cabang (scan ratio random)
 * 10. Summary akhir
 */

const BASE      = 'http://127.0.0.1:8000/api';
const START_TIME = Date.now();
const START_DATE = new Date();

// ── helpers ───────────────────────────────────────────────────────────────────
const rnd    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick   = arr => arr[rnd(0, arr.length - 1)];
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const fmt    = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtDate = d => d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' });
const fmtDur = ms => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}j ${m % 60}m ${s % 60}d`;
    if (m > 0) return `${m}m ${s % 60}d`;
    return `${s}d`;
};
const section = t => {
    const elapsed = fmtDur(Date.now() - START_TIME);
    console.log(`\n${'═'.repeat(70)}\n  ${t}  [+${elapsed}]\n${'═'.repeat(70)}`);
};
const log    = (icon, msg) => console.log(`${icon} ${msg}`);

let TOKEN = '';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` });

async function api(method, path, body) {
    const opts = { method, headers: hdrs() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res  = await fetch(`${BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) console.error(`  ✗ ${method} ${path} → ${res.status} ${json?.message ?? JSON.stringify(json?.errors ?? '')}`);
    return json;
}

async function apiForm(path, fields) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields))
        if (v !== null && v !== undefined) form.append(k, String(v));
    const res  = await fetch(`${BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form });
    return res.json().catch(() => ({}));
}

/** POST multipart dengan array fields seperti branch_id[] */
async function apiFormArray(path, fields, arrays = {}) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields))
        if (v !== null && v !== undefined) form.append(k, String(v));
    for (const [k, arr] of Object.entries(arrays))
        arr.forEach(v => form.append(`${k}[]`, String(v)));
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form });
    return res.json().catch(() => ({}));
}

const get  = async path => { const j = await api('GET', path); return j?.data ?? j; };
const post = async (path, body) => { const j = await api('POST', path, body); return j?.data ?? j; };

function toArr(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 0 — LOGIN
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 0: Login → Ambil Token Segar');

{
    const res = await api('POST', '/login', { username: 'tokoemas', password: 'tokoemas' });
    TOKEN = res?.data?.user?.token;
    if (!TOKEN) { console.error('Login gagal!', JSON.stringify(res)); process.exit(1); }
    log('🔑', `Login OK → ${TOKEN.substring(0, 24)}...`);
    log('🕐', `Waktu mulai: ${fmtDate(START_DATE)}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — MASTER DATA
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 1: Setup Master Data');

// ── 1a. 20 cabang ─────────────────────────────────────────────────────────────
const CABANG_DEFS = [
    { name: 'Jakarta Pusat',     code: 'JKP',  lokasi: 'Jakarta' },
    { name: 'Jakarta Selatan',   code: 'JKS',  lokasi: 'Jakarta' },
    { name: 'Jakarta Utara',     code: 'JKU',  lokasi: 'Jakarta' },
    { name: 'Jakarta Barat',     code: 'JKB',  lokasi: 'Jakarta' },
    { name: 'Jakarta Timur',     code: 'JKT',  lokasi: 'Jakarta' },
    { name: 'Bogor Kota',        code: 'BGR',  lokasi: 'Bogor' },
    { name: 'Bogor Barat',       code: 'BGB',  lokasi: 'Bogor' },
    { name: 'Depok',             code: 'DPK',  lokasi: 'Depok' },
    { name: 'Bekasi Kota',       code: 'BKS',  lokasi: 'Bekasi' },
    { name: 'Bekasi Barat',      code: 'BKB',  lokasi: 'Bekasi' },
    { name: 'Tangerang Kota',    code: 'TNG',  lokasi: 'Tangerang' },
    { name: 'Tangerang Selatan', code: 'TGS',  lokasi: 'Tangerang' },
    { name: 'Serpong',           code: 'SRP',  lokasi: 'Tangerang' },
    { name: 'Cibinong',          code: 'CBN',  lokasi: 'Bogor' },
    { name: 'Cileungsi',         code: 'CLG',  lokasi: 'Bogor' },
    { name: 'Cibitung',          code: 'CBT',  lokasi: 'Bekasi' },
    { name: 'Karawang',          code: 'KRW',  lokasi: 'Karawang' },
    { name: 'Cikarang',          code: 'CKR',  lokasi: 'Bekasi' },
    { name: 'Kebayoran Lama',    code: 'KBL',  lokasi: 'Jakarta' },
    { name: 'Kelapa Gading',     code: 'KLG',  lokasi: 'Jakarta' },
];

const existingBranches = toArr(await get('/branches?per_page=100'));
const existingBranchNames = new Set(existingBranches.map(b => b.branch_name));

for (const def of CABANG_DEFS) {
    if (existingBranchNames.has(def.name)) continue;
    await apiForm('/branches', {
        branch_name:      def.name,
        branch_code:      def.code + rnd(10, 99),
        address:          `Jl. ${def.name} No. ${rnd(1, 200)}`,
        lokasi_cabang:    def.lokasi,
        pic:              3,
        branch_open_date: `2026-0${rnd(1, 9)}-0${rnd(1, 9)}`,
        phone_numbers:    `08${rnd(10, 99)}${rnd(1000000, 9999999)}`,
        is_active:        1,
    });
}

const BRANCHES = toArr(await get('/branches?per_page=100')).map(b => ({ id: b.id, name: b.branch_name, bank_cabang_id: null }));
log('🏪', `Total cabang: ${BRANCHES.length}`);

// ── 1b. Bank + rekening per cabang ────────────────────────────────────────────
let bankId;
{
    const bankList = toArr(await get('/banks?per_page=100'));
    bankId = bankList[0]?.id;
    if (!bankId) {
        const res = await apiForm('/banks', { bank_name: 'Bank Central Asia', bank_code: 'BCA', is_active: 1 });
        bankId = (res?.data ?? res)?.id ?? 1;
    }
}

const existingBC   = toArr(await get('/bankCabangs?per_page=200'));
const bcByBranchId = Object.fromEntries(existingBC.map(bc => [bc.branch_id, bc.id]));

for (const br of BRANCHES) {
    if (bcByBranchId[br.id]) { br.bank_cabang_id = bcByBranchId[br.id]; continue; }
    const res = await apiForm('/bankCabangs', {
        branch_id:      br.id,
        bank_id:        bankId,
        nomor_rekening: `00${rnd(100000, 999999)}`,
        nama_pemilik:   br.name,
        is_active:      1,
    });
    br.bank_cabang_id = (res?.data ?? res)?.id ?? null;
}
log('🏦', `Bank cabang: ${BRANCHES.filter(b => b.bank_cabang_id).length}/${BRANCHES.length}`);

// ── 1c. Supplier ──────────────────────────────────────────────────────────────
const existingSuppliers = toArr(await get('/suppliers?per_page=100'));
const SUPPLIERS = existingSuppliers.map(s => s.id);
const supplierNames = ['PT Emas Murni','CV Logam Jaya','UD Berlian Mas','PT Cahaya Emas','CV Mitra Logam'];
for (const sname of supplierNames) {
    if (existingSuppliers.find(s => s.supplier_name === sname)) continue;
    const res = await apiForm('/suppliers', {
        supplier_name: sname,
        phone_number:  `08${rnd(100000, 9999999)}`,
        address:       `Jl. Supplier ${rnd(1, 100)}`,
        is_active:     1,
    });
    const sid = (res?.data ?? res)?.id;
    if (sid) SUPPLIERS.push(sid);
}
log('🏭', `Supplier: ${SUPPLIERS.length}`);

// ── 1d. Kategori & produk ─────────────────────────────────────────────────────
const existingCats = toArr(await get('/categories?per_page=200'));

const PARENT_NAMES = ['Cincin','Kalung','Gelang','Anting','Liontin','Bros'];
const SUB_NAMES    = ['Polos','Motif Bunga','Motif Ukir','Model Terbaru'];

// Buat/cari parent categories — simpan hasil create agar punya category_code
const parentCats = [];
for (const cname of PARENT_NAMES) {
    const ex = existingCats.find(c => c.category_name === cname && !c.parent_id);
    if (ex) { parentCats.push(ex); continue; }
    const catCode = cname.substring(0, 3).toUpperCase() + rnd(10, 99);
    const res = await apiForm('/categories', {
        category_name: cname,
        description:   `Kategori ${cname}`,
        category_code: catCode,
        is_active:     1,
    });
    const cat = (res?.data ?? res);
    // Pastikan category_code tersimpan (dari create response atau generate ulang)
    if (cat?.id) {
        if (!cat.category_code) cat.category_code = catCode;
        parentCats.push(cat);
    }
}

// Re-fetch semua kategori setelah create, lalu buat sub
const allCats = toArr(await get('/categories?per_page=500'));

// Patch parentCats dengan data terbaru dari DB (agar category_code valid)
for (let i = 0; i < parentCats.length; i++) {
    const fresh = allCats.find(c => c.id === parentCats[i].id);
    if (fresh) parentCats[i] = fresh;
    if (!parentCats[i].category_code)
        parentCats[i].category_code = parentCats[i].category_name.substring(0, 3).toUpperCase() + rnd(10, 99);
}

const subCats = [];
for (const pcat of parentCats) {
    for (const sname of SUB_NAMES) {
        const full = `${pcat.category_name} ${sname}`;
        // Cari di allCats berdasarkan nama DAN parent_id
        const ex = allCats.find(c => c.category_name === full && (c.parent_id == pcat.id || c.parent?.id == pcat.id));
        if (ex) { subCats.push({ ...ex, _parent: pcat }); continue; }
        const subCode = pcat.category_code.substring(0, 3).toUpperCase() + sname.substring(0, 2).toUpperCase() + rnd(10, 99);
        const res = await apiForm('/categories', {
            category_name: full,
            description:   full,
            category_code: subCode,
            parent_id:     pcat.id,
            is_active:     1,
        });
        const cat = (res?.data ?? res);
        if (cat?.id) subCats.push({ ...cat, _parent: pcat });
    }
}
log('📂', `Kategori: ${parentCats.length} parent, ${subCats.length} sub`);

// Buat produk (~120 produk: 6 parent × 4 sub × 5 berat)
const BERAT_OPTS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

// Daftar produk yang akan dibuat
const prodDefs = [];
for (const sub of subCats) {
    const pcat = sub._parent ?? parentCats.find(p => p.id === (sub.parent_id ?? sub.parent?.id));
    if (!pcat) continue;
    for (const berat of BERAT_OPTS.slice(0, 5)) {
        prodDefs.push({ name: `${sub.category_name} ${berat}gr`, cat: pcat, sub });
    }
}

// Fetch produk yang sudah ada (paginated — bisa lebih dari 200)
const PRODUCTS = [];
for (let page = 1; ; page++) {
    const res  = await api('GET', `/products?per_page=200&page=${page}`);
    const list = toArr(res);
    list.forEach(p => PRODUCTS.push(p));
    if (!res?.next_page_url || list.length < 200) break;
}

const existingProdNames = new Set(PRODUCTS.map(p => p.product_name));

// Semua cabang untuk produk baru
const allBranchIds = BRANCHES.map(b => b.id);
let addedProds = 0;
const newProds = [];

for (const def of prodDefs) {
    if (existingProdNames.has(def.name)) continue;
    const res = await apiFormArray('/products', {
        product_name:   def.name,
        description:    `Produk ${def.name}`,
        category_id:    def.cat.id,
        subcategory_id: def.sub.id,
        is_active:      1,
    }, { branch_id: allBranchIds });
    const prod = (res?.data ?? res);
    if (prod?.id) {
        // Pastikan field yang dibutuhkan tersedia
        prod.category_id    = prod.category_id    ?? def.cat.id;
        prod.subcategory_id = prod.subcategory_id ?? def.sub.id;
        PRODUCTS.push(prod);
        newProds.push(prod);
        addedProds++;
    } else {
        console.error(`  ✗ Gagal buat produk: ${def.name}`, JSON.stringify(res));
    }
}

// Patch existing products yang mungkin tidak punya category_id/subcategory_id di response
for (const p of PRODUCTS) {
    if (!p.category_id && p.category?.id)    p.category_id    = p.category.id;
    if (!p.subcategory_id && p.subcategory?.id) p.subcategory_id = p.subcategory.id;
}

log('💍', `Produk: ${PRODUCTS.length} total (${addedProds} baru)`);

// ── 1e. User kasir per cabang ─────────────────────────────────────────────────
const existingUsers = toArr(await get('/users?per_page=200'));
const existingUsernames = new Set(existingUsers.map(u => u.username));
let newUsers = 0;
for (const br of BRANCHES) {
    const slug  = br.name.toLowerCase().replace(/\s+/g, '_').substring(0, 12);
    const uname = `kasir_${slug}`;
    if (existingUsernames.has(uname)) continue;
    await apiForm('/users', {
        username: uname,
        name:     `Kasir ${br.name}`,
        email:    `${uname}${rnd(10,99)}@tokoemas.com`,
        password: 'password123',
        role_id:  4,
        branch_id: br.id,
        is_active: 1,
    });
    newUsers++;
}
log('👤', `User kasir baru: ${newUsers}`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — MODAL AWAL 10JT TUNAI + 10JT TRANSFER
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 2: Modal Awal 10jt Tunai + 10jt Transfer per Cabang');

for (const br of BRANCHES) {
    await apiForm('/finances', { branch_id: br.id, category_finance_id: 4, bank_cabang_id: 0,               type: 'CASH IN', payment_method: 'TUNAI',    nominal: 10000000, note: `Modal tunai ${br.name}` });
    if (br.bank_cabang_id) {
        await apiForm('/finances', { branch_id: br.id, category_finance_id: 4, bank_cabang_id: br.bank_cabang_id, type: 'CASH IN', payment_method: 'TRANSFER', nominal: 10000000, note: `Modal transfer ${br.name}` });
    }
}
log('💰', `Modal per cabang: ${fmt(20000000)} × ${BRANCHES.length} = ${fmt(20000000 * BRANCHES.length)}`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — PEMBELIAN ~1000 ITEM PER CABANG
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 3: Pembelian ~100 Item per Cabang');

const ITEMS_PER_BRANCH = 100;
const BATCH_SIZE       = 10;
const KARAT_LIST       = [18, 22, 24];

// Filter produk yang valid (punya category_id dan subcategory_id)
const validProds = PRODUCTS.filter(p => p.category_id && p.subcategory_id);
if (!validProds.length) { console.error('❌ Tidak ada produk valid! Stop.'); process.exit(1); }

// Tiap cabang dapat subset produk random berbeda (60-90% dari total produk)
const branchProdSubset = {};
for (const br of BRANCHES) {
    const take = Math.ceil(validProds.length * (0.6 + Math.random() * 0.3));
    branchProdSubset[br.id] = shuffle(validProds).slice(0, take);
}

const allPembelianIds = {}; // branch_id → [pembelian_id]
let totalPembelian = 0;

for (const br of BRANCHES) {
    const prods = branchProdSubset[br.id];
    if (!prods.length) { log('⚠️', `${br.name}: no products`); continue; }

    const numBatches = Math.ceil(ITEMS_PER_BRANCH / BATCH_SIZE);
    allPembelianIds[br.id] = [];
    let brCount = 0;

    for (let b = 0; b < numBatches; b++) {
        const items = [];
        for (let j = 0; j < BATCH_SIZE; j++) {
            const prod     = prods[(b * BATCH_SIZE + j) % prods.length];
            const isTunai  = Math.random() > 0.4;
            const modal    = Math.round((300000 + Math.random() * 5000000) / 1000) * 1000;
            items.push({
                branch_id:       br.id,
                product_id:      prod.id,
                category_id:     prod.category_id,
                subcategory_id:  prod.subcategory_id,
                tipe_pembayaran: isTunai ? 'TUNAI' : 'TRANSFER',
                bank_cabang_id:  isTunai ? null : (br.bank_cabang_id ?? null),
                supplier_id:     pick(SUPPLIERS) ?? 1,
                barcode:         prod.barcode,
                serial_number:   `SN-${br.id}-${b}-${j}-${rnd(100, 999)}`,
                berat:           parseFloat((0.5 + Math.random() * 12).toFixed(2)),
                karat:           pick(KARAT_LIST),
                modal,
                jual:            modal + Math.round(modal * (0.08 + Math.random() * 0.22)),
            });
        }
        const res     = await api('POST', '/pembelian', { data: items });
        const created = res?.data ?? [];
        if (Array.isArray(created)) {
            created.forEach(c => { if (c?.id) allPembelianIds[br.id].push(c.id); });
            brCount += created.length;
        }
    }
    totalPembelian += brCount;
    log('  📋', `${br.name}: ${brCount} pembelian (${numBatches} batch)`);
}
log('✅', `Total pembelian: ${totalPembelian}`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 4 — APPROVE/TOLAK RANDOM PER CABANG
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 4: Approve/Tolak Pembelian (Random per Cabang)');

const REJECT_NOTES  = ['Karat tidak sesuai','Dokumen tidak lengkap','Harga tidak cocok','Barang cacat','Sumber tidak jelas'];
const APPROVAL_BATCH = 50;
const branchInvMap   = {};
let totalApproved = 0, totalRejected = 0;

for (const br of BRANCHES) {
    const ids = allPembelianIds[br.id] ?? [];
    if (!ids.length) continue;

    // Random: 40–70% approve, 10–25% tolak, sisanya pending
    const approveRatio = 0.40 + Math.random() * 0.30;
    const rejectRatio  = 0.10 + Math.random() * 0.15;
    const shuffled     = shuffle(ids);
    const approveCount = Math.ceil(shuffled.length * approveRatio);
    const rejectCount  = Math.ceil(shuffled.length * rejectRatio);
    const approveIds   = shuffled.slice(0, approveCount);
    const rejectIds    = shuffled.slice(approveCount, approveCount + rejectCount);

    for (let i = 0; i < approveIds.length; i += APPROVAL_BATCH)
        await api('POST', '/update-pembelian', { status: 'DISETUJUI', pembelian_ids: approveIds.slice(i, i + APPROVAL_BATCH) });
    for (let i = 0; i < rejectIds.length; i += APPROVAL_BATCH)
        await api('POST', '/update-pembelian', { status: 'DITOLAK', pembelian_ids: rejectIds.slice(i, i + APPROVAL_BATCH), note: pick(REJECT_NOTES) });

    branchInvMap[br.id] = toArr(await get(`/inventory?per_page=10000&status=AVAILABLE&branch_id=${br.id}`));
    totalApproved += approveIds.length;
    totalRejected += rejectIds.length;
    log('✅', `${br.name}: +${approveIds.length} approve, -${rejectIds.length} tolak → ${branchInvMap[br.id].length} inv`);
}
log('📊', `Approve: ${totalApproved}, Tolak: ${totalRejected}`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 5 — CUSTOMER PER CABANG + PENJUALAN RANDOM (LINTAS CABANG)
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 5: Customer per Cabang + Penjualan Random (lintas cabang)');

const KOTA_LIST  = ['Jakarta','Bogor','Bekasi','Tangerang','Depok','Karawang','Cikarang'];
const JALAN_LIST = ['Melati','Mawar','Anggrek','Kenanga','Dahlia','Merpati','Garuda'];

// Nama customer pool — cukup banyak agar tiap cabang bisa dapat 8-12 customer baru
const CUST_NAME_POOL = [
    'Siti Nurhaliza','Budi Santoso','Dewi Kartika','Ahmad Rizky','Ratna Permata',
    'Joko Susilo','Maya Indah','Rudi Hartono','Lina Wati','Bambang Wijaya',
    'Nurul Hidayah','Dedi Kurniawan','Sri Wahyuni','Agus Purnomo','Rina Susanti',
    'Hendra Kusuma','Fitri Rahayu','Doni Pratama','Wulandari','Surya Darma',
    'Putri Amelia','Fajar Nugroho','Ika Puspita','Rizal Hakim','Dewi Lestari',
    'Taufik Hidayat','Anisa Rahma','Bagas Prasetyo','Yuli Astuti','Robi Santoso',
    'Nadia Permata','Guntur Wibowo','Sari Kusuma','Eko Prasetyo','Lestari Ayu',
    'Wahyu Nugroho','Prita Andriani','Dimas Saputra','Retno Widiastuti','Heri Susanto',
    'Citra Nirmala','Galih Pratama','Indah Sari','Rian Maulana','Yanti Widodo',
    'Febri Kurniawan','Novi Rahayu','Andri Setiawan','Mira Oktaviani','Deni Sulaiman',
    'Lia Anggraini','Tomy Hermawan','Reza Fauzan','Ayu Wandira','Bayu Kurniawan',
    'Sinta Maharani','Arif Budiman','Dina Fitriani','Yoga Pratama','Rini Lestari',
    'Kevin Santoso','Amanda Putri','Rizki Ramadhan','Nita Dewi','Aldi Firmansyah',
    'Tika Rahayu','Gilang Permana','Vera Kusuma','Farid Hakim','Laras Wulandari',
    'Hendro Purnomo','Melisa Anggraini','Wahid Setiawan','Puji Rahayu','Dani Saputra',
    'Cici Pertiwi','Aryo Wibisono','Dwi Astuti','Feri Irawan','Ningsih Suryati',
    'Ilham Syahputra','Septi Handayani','Agung Nugroho','Wida Octavia','Hendra Gunawan',
    'Suci Ramadhani','Ikhsan Maulana','Tri Wahyuni','Bimo Prakoso','Neni Susanti',
    'Lutfi Hamdani','Anis Fitriya','Rido Saputra','Fitria Ningrum','Wisnu Wardana',
    'Endah Kurniawati','Syahrul Hidayat','Pipit Rahayu','Zaki Ramadhan','Lastri Dewi',
    'Elaina Ramadhan','Faldi Ramadhan',
];

// Fetch customer yang sudah ada
const existingCusts    = toArr(await get('/customers?per_page=500'));
const existingCustNames = new Set(existingCusts.map(c => c.customer_name));

// Pool nama yang belum terdaftar
const availableNames = shuffle(CUST_NAME_POOL.filter(n => !existingCustNames.has(n)));
let nameIdx = 0;

// Tiap cabang punya 8-12 customer "utama" + beberapa customer existing (lintas cabang)
const branchCustomers = {}; // branch_id → [customer_id]
const ALL_CUSTOMERS   = existingCusts.map(c => ({ id: c.id, name: c.customer_name }));

for (const br of BRANCHES) {
    const newCount = rnd(8, 12);
    const custIds  = [];

    // Buat customer baru untuk cabang ini
    for (let i = 0; i < newCount; i++) {
        const cname = availableNames[nameIdx++] ?? `Customer ${br.name} ${i + 1}`;
        const res   = await post('/customers', {
            customer_name: cname,
            address:       `Jl. ${pick(JALAN_LIST)} No. ${rnd(1, 200)}, ${pick(KOTA_LIST)}`,
            phone_number:  `08${rnd(10, 99)}${rnd(10000000, 99999999)}`,
            is_active:     1,
        });
        if (res?.id) {
            custIds.push(res.id);
            ALL_CUSTOMERS.push({ id: res.id, name: cname });
        }
    }

    // Tambahkan 2-5 customer dari cabang lain (simulasi customer yang sudah terdaftar)
    if (ALL_CUSTOMERS.length > newCount) {
        const crossCount = rnd(2, 5);
        shuffle(ALL_CUSTOMERS)
            .filter(c => !custIds.includes(c.id))
            .slice(0, crossCount)
            .forEach(c => custIds.push(c.id));
    }

    branchCustomers[br.id] = custIds;
    log('👤', `${br.name}: ${newCount} customer baru + ${branchCustomers[br.id].length - newCount} lintas cabang`);
}
log('👥', `Total customer terdaftar: ${ALL_CUSTOMERS.length}`);

// ── Penjualan per cabang ──────────────────────────────────────────────────────
let totalSalesCreated = 0;
for (const br of BRANCHES) {
    const invList  = (branchInvMap[br.id] ?? []).filter(i => i.status === 'AVAILABLE');
    if (!invList.length) continue;

    const custPool = branchCustomers[br.id] ?? ALL_CUSTOMERS.map(c => c.id);
    const sellRatio = 0.30 + Math.random() * 0.35;
    const toSell    = shuffle(invList).slice(0, Math.ceil(invList.length * sellRatio));

    let idx = 0, trxCount = 0;
    while (idx < toSell.length) {
        const size    = rnd(1, Math.min(5, toSell.length - idx));
        const batch   = toSell.slice(idx, idx + size);
        // 70% pilih dari customer cabang ini, 30% customer random dari pool global (lintas cabang)
        const custId  = Math.random() < 0.70
            ? pick(custPool)
            : pick(ALL_CUSTOMERS).id;
        const isTunai = Math.random() > 0.45;
        const total   = batch.reduce((s, inv) => s + Number(inv.jual), 0);

        await api('POST', '/sales', {
            customer_id:       custId,
            branch_id:         br.id,
            payment_type:      isTunai ? 'TUNAI' : 'TRANSFER',
            nominal_paid:      isTunai ? total + rnd(0, 150000) : null,
            exchange:          isTunai ? rnd(0, 150000) : null,
            sender_bank_name:  !isTunai ? 'BCA' : null,
            sender_rekening:   !isTunai ? `00${rnd(100000, 999999)}` : null,
            sender_bank_id:    !isTunai ? bankId : null,
            receiver_bank_id:  !isTunai ? (br.bank_cabang_id ?? null) : null,
            item: batch.map(inv => ({ inventory_code: inv.inventory_code, product_id: inv.product_id, price: Number(inv.jual) })),
        });
        idx += size;
        trxCount++;
        totalSalesCreated++;
    }
    log('🛒', `${br.name}: ${trxCount} transaksi, ${toSell.length} item dijual`);
}
log('✅', `Total penjualan dibuat: ${totalSalesCreated}`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 6 — APPROVE PENJUALAN → SELESAI (inventory SOLD + finance CASH IN)
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 6: Approve Penjualan → Selesai');

// Ambil semua penjualan APPROVAL (paginate)
const allSalesPending = [];
for (let page = 1; ; page++) {
    const res  = await api('GET', `/sales?per_page=200&page=${page}`);
    const list = res?.data ?? [];
    list.filter(s => s.approval_status === 'APPROVAL').forEach(s => allSalesPending.push(s));
    if (!res?.next_page_url || list.length < 200) break;
}
log('📋', `Sales pending: ${allSalesPending.length}`);

const shuffledSales  = shuffle(allSalesPending);
const salesApprCount = Math.ceil(shuffledSales.length * 0.85);
const approvedSales  = shuffledSales.slice(0, salesApprCount);
const rejectedSales  = shuffledSales.slice(salesApprCount);

// Flow: APPROVAL → DISETUJUI → CETAK KWITANSI → SELESAI (trigger inventory SOLD + finance)
let cetakOk = 0;
for (const sale of approvedSales) {
    await api('PUT', '/update-sales', { penjualan_id: sale.id, status: 'DISETUJUI' });
    await api('PUT', '/update-sales', { penjualan_id: sale.id, status: 'CETAK KWITANSI' });
    const res = await api('PUT', '/update-sales', { penjualan_id: sale.id, status: 'SELESAI' });
    if (res?.success !== false) cetakOk++;
}
for (const sale of rejectedSales)
    await api('PUT', '/update-sales', { penjualan_id: sale.id, status: 'DITOLAK' });

log('✅', `Disetujui: ${approvedSales.length}, Kwitansi: ${cetakOk}, Ditolak: ${rejectedSales.length}`);

for (const br of BRANCHES)
    branchInvMap[br.id] = toArr(await get(`/inventory?per_page=10000&status=AVAILABLE&branch_id=${br.id}`));

// ══════════════════════════════════════════════════════════════════════════════
// STEP 7 — TRANSFER ITEM ANTAR CABANG (RANDOM)
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 7: Transfer Item Antar Cabang (Random)');

// Pilih 30-50% cabang sebagai source transfer
const transferSources = shuffle(BRANCHES).slice(0, Math.ceil(BRANCHES.length * (0.3 + Math.random() * 0.2)));
const transferResults = [];

for (const srcBr of transferSources) {
    const available = (branchInvMap[srcBr.id] ?? []).filter(i => i.status === 'AVAILABLE');
    if (available.length < 2) continue;

    // Transfer 5-15% inventory
    const transferCount = Math.max(1, Math.ceil(available.length * (0.05 + Math.random() * 0.10)));
    const toTransfer    = shuffle(available).slice(0, transferCount);
    const destBr        = pick(BRANCHES.filter(b => b.id !== srcBr.id));

    const res    = await api('POST', '/transfer-item', {
        branch_source_id: srcBr.id,
        branch_dest_id:   destBr.id,
        item: toTransfer.map(inv => ({ inventory_code: inv.inventory_code, product_id: inv.product_id })),
    });
    const tId    = res?.data?.id ?? null;
    // Lebih sering disetujui
    const action = pick(['DISETUJUI', 'DISETUJUI', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN']);

    if (tId) {
        await api('PUT', '/update-transfer-item', {
            transfer_item_id: tId,
            status: action,
            note:   action !== 'DISETUJUI' ? pick(['Tidak diperlukan', 'Stok cukup', 'Anggaran tidak ada']) : null,
        });
    }

    log('🚚', `${srcBr.name} → ${destBr.name}: ${toTransfer.length} item (${action})`);
    transferResults.push({ from: srcBr.name, to: destBr.name, count: toTransfer.length, status: action });

    // Update local inv map jika disetujui (approx)
    if (action === 'DISETUJUI') {
        const movedCodes = new Set(toTransfer.map(i => i.inventory_code));
        branchInvMap[srcBr.id] = (branchInvMap[srcBr.id] ?? []).filter(i => !movedCodes.has(i.inventory_code));
        if (!branchInvMap[destBr.id]) branchInvMap[destBr.id] = [];
        toTransfer.forEach(i => branchInvMap[destBr.id].push({ ...i, branch_id: destBr.id }));
    }
}
log('✅', `Transfer selesai: ${transferResults.length} transaksi`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 8 — REMOVE ITEM (HILANG & REPAIR) RANDOM
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 8: Remove Item (Hilang & Repair) Random');

// 40-60% cabang lakukan remove item
const removeSources = shuffle(BRANCHES).slice(0, Math.ceil(BRANCHES.length * (0.4 + Math.random() * 0.2)));
const removeResults = [];

for (const br of removeSources) {
    const available = (branchInvMap[br.id] ?? []).filter(i => i.status === 'AVAILABLE');
    if (!available.length) continue;

    const removeCount = Math.max(1, Math.ceil(available.length * (0.02 + Math.random() * 0.05)));
    const toRemove    = shuffle(available).slice(0, removeCount);
    const jenis       = Math.random() > 0.5 ? 'HILANG' : 'REPAIR';

    const res  = await api('POST', '/remove-item', {
        branch_id: br.id,
        jenis,
        note: jenis === 'HILANG' ? pick(['Barang hilang saat operasional','Tidak ada saat audit','Dicuri']) : pick(['Perlu diperbaiki','Rusak ringan','Cacat produksi']),
        item: toRemove.map(inv => ({ inventory_code: inv.inventory_code, product_id: inv.product_id })),
    });
    const rId     = res?.data?.id ?? null;
    const action  = pick(['DISETUJUI', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN']);

    if (rId) {
        await api('PUT', '/update-remove-item', {
            remove_id: rId,
            status:    action,
            note:      action !== 'DISETUJUI' ? pick(['Tidak dikonfirmasi', 'Masih dicari', 'Ditemukan kembali']) : null,
        });

        // REPAIR + DISETUJUI: 50% chance RETURN
        if (jenis === 'REPAIR' && action === 'DISETUJUI' && Math.random() > 0.5) {
            await api('PUT', '/update-remove-item', { remove_id: rId, status: 'RETURN', note: 'Barang sudah diperbaiki' });
            log('🔧', `${br.name}: ${toRemove.length} REPAIR → RETURN`);
            removeResults.push({ branch: br.name, count: toRemove.length, jenis, status: 'RETURN' });
            continue;
        }
    }

    log(`${jenis === 'HILANG' ? '🔍' : '🔧'}`, `${br.name}: ${toRemove.length} ${jenis} (${action})`);
    removeResults.push({ branch: br.name, count: toRemove.length, jenis, status: action });
}
log('✅', `Remove item: ${removeResults.length} transaksi`);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 9 — STOCK OPNAME PER CABANG (RANDOM SCAN RATIO)
// ══════════════════════════════════════════════════════════════════════════════
section('STEP 9: Stock Opname per Cabang');

for (const br of BRANCHES)
    branchInvMap[br.id] = toArr(await get(`/inventory?per_page=10000&status=AVAILABLE&branch_id=${br.id}`));

const opnameResults = [];
for (const br of BRANCHES) {
    const brInv = (branchInvMap[br.id] ?? []).filter(i => i.status === 'AVAILABLE');
    if (!brInv.length) { log('⚠️', `${br.name}: 0 item, skip`); continue; }

    // Scan ratio 70-100% (random per cabang)
    const scanRatio  = 0.70 + Math.random() * 0.30;
    const scanCount  = Math.ceil(brInv.length * scanRatio);
    const shuffledInv = shuffle(brInv);

    const items = [];
    shuffledInv.slice(0, scanCount).forEach(i => items.push({
        inventory_code: i.inventory_code, product_id: i.product_id,
        last_status: i.status, opname_status: 'INSTOCK',
    }));
    shuffledInv.slice(scanCount).forEach(i => items.push({
        inventory_code: i.inventory_code, product_id: i.product_id,
        last_status: i.status, opname_status: 'MISSING',
    }));

    // EXTRA item dari cabang lain: 0-3 item
    const extraCount = rnd(0, 3);
    for (let e = 0; e < extraCount; e++) {
        const otherBr  = pick(BRANCHES.filter(b => b.id !== br.id));
        const otherInv = (branchInvMap[otherBr.id] ?? []).filter(i => i.status === 'AVAILABLE');
        if (!otherInv.length) continue;
        const extra = pick(otherInv);
        if (!items.find(i => i.inventory_code === extra.inventory_code)) {
            items.push({
                inventory_code: extra.inventory_code, product_id: extra.product_id,
                last_status: extra.status, opname_status: 'EXTRA',
                note: `Dari cabang ${otherBr.name}`,
            });
        }
    }

    await api('POST', '/stock-opname', { branch_id: br.id, item: items });

    const instock = items.filter(i => i.opname_status === 'INSTOCK').length;
    const missing = items.filter(i => i.opname_status === 'MISSING').length;
    const extra   = items.filter(i => i.opname_status === 'EXTRA').length;
    log('📋', `${br.name}: ${brInv.length} inv → IN=${instock} MISS=${missing} EXTRA=${extra}`);
    opnameResults.push({ branch: br.name, total: brInv.length, instock, missing, extra });
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 10 — SUMMARY AKHIR
// ══════════════════════════════════════════════════════════════════════════════
section('RINGKASAN AKHIR');

const totals  = await get('/report/total-count');
const summary = await get('/report/finance-summary');
const invAvail = (await api('GET', '/inventory?per_page=1&status=AVAILABLE'))?.total || 0;
const invSold  = (await api('GET', '/inventory?per_page=1&status=SOLD'))?.total || 0;
const invRep   = (await api('GET', '/inventory?per_page=1&status=REPAIR'))?.total || 0;
const invLost  = (await api('GET', '/inventory?per_page=1&status=LOST'))?.total || 0;
const pemApp   = (await api('GET', '/pembelian?status=APPROVAL&per_page=1'))?.total || 0;
const pemOk    = (await api('GET', '/pembelian?status=DISETUJUI&per_page=1'))?.total || 0;
const pemNo    = (await api('GET', '/pembelian?status=DITOLAK&per_page=1'))?.total || 0;
const totalSls = (await api('GET', '/sales?per_page=1'))?.total || 0;
const tfrTotal = (await api('GET', '/transfer-item?per_page=1'))?.total || 0;
const rmvTotal = (await api('GET', '/remove-item?per_page=1'))?.total || 0;
const opnTotal = (await api('GET', '/stock-opname?per_page=1'))?.total || 0;

const W = 70;
const line  = `│  `;
const bot   = `└${'─'.repeat(W - 2)}┘`;
const sep   = `├${'─'.repeat(W - 2)}┤`;
const r = (label, val) => `${line}${label.padEnd(22)}: ${String(val).padEnd(W - 28)}│`;

console.log(`
┌${'─'.repeat(W - 2)}┐
│${'  SKENARIO TEST v2 — RINGKASAN AKHIR'.padEnd(W - 2)}│
├${'═'.repeat(W - 2)}┤
│${''.padEnd(W - 2)}│
${r('Cabang', BRANCHES.length + ' cabang')}
${r('Produk', PRODUCTS.length + ' produk')}
${r('Customer', ALL_CUSTOMERS.length + ' customer')}
${r('Supplier', SUPPLIERS.length + ' supplier')}
${sep}
${line}${'💰 MODAL AWAL'.padEnd(W - 4)}│
${r('  Per cabang', fmt(20000000) + ' (10jt tunai + 10jt transfer)')}
${r('  Total', fmt(20000000 * BRANCHES.length))}
${sep}
${line}${'📋 PEMBELIAN'.padEnd(W - 4)}│
${r('  Total dibuat', totalPembelian + ' (batch 10 item)')}
${r('  Disetujui', pemOk + ' → inventory terbentuk')}
${r('  Ditolak', pemNo)}
${r('  Pending', pemApp)}
${sep}
${line}${'📦 INVENTORY'.padEnd(W - 4)}│
${r('  AVAILABLE', invAvail)}
${r('  SOLD', invSold)}
${r('  REPAIR', invRep)}
${r('  LOST', invLost)}
${sep}
${line}${'🛒 PENJUALAN'.padEnd(W - 4)}│
${r('  Total transaksi', totalSls)}
${r('  Selesai (SOLD)', cetakOk)}
${r('  Ditolak', rejectedSales.length)}
${sep}
${line}${'🚚 TRANSFER ITEM'.padEnd(W - 4)}│
${r('  Total transaksi', tfrTotal)}
${transferResults.slice(0, 10).map(t => r(`  ${t.from.slice(0,12)}→${t.to.slice(0,8)}`, `${t.count} item (${t.status})`)).join('\n')}
${transferResults.length > 10 ? r('  ...dan lainnya', `${transferResults.length - 10} transaksi lagi`) : ''}
${sep}
${line}${'🔍 REMOVE ITEM'.padEnd(W - 4)}│
${r('  Total transaksi', rmvTotal)}
${removeResults.slice(0, 10).map(rm => r(`  ${rm.branch.slice(0,14)}`, `${rm.count} ${rm.jenis} (${rm.status})`)).join('\n')}
${removeResults.length > 10 ? r('  ...dan lainnya', `${removeResults.length - 10} transaksi lagi`) : ''}
${sep}
${line}${'📋 STOCK OPNAME'.padEnd(W - 4)}│
${r('  Total sesi', opnTotal)}
${opnameResults.slice(0, 10).map(o => r(`  ${o.branch.slice(0,16)}`, `${o.total} inv IN=${o.instock} MISS=${o.missing} EXT=${o.extra}`)).join('\n')}
${sep}
${line}${'💰 SALDO AKHIR'.padEnd(W - 4)}│
${r('  KAS Tunai', fmt(totals?.total_cash))}
${r('  Bank', fmt(totals?.total_transfer))}
${r('  TOTAL', fmt(totals?.total_all))}
${sep}
${line}${'📊 FINANCE SUMMARY'.padEnd(W - 4)}│
${r('  Saldo Awal', fmt(summary?.summary?.opening_balance))}
${r('  Cash In', fmt(summary?.summary?.cash_in))}
${r('  Cash Out', fmt(summary?.summary?.cash_out))}
${r('  Saldo Akhir', fmt(summary?.summary?.closing_balance))}
${sep}
${line}${'⏱️  WAKTU EKSEKUSI'.padEnd(W - 4)}│
${r('  Mulai', fmtDate(START_DATE))}
${r('  Selesai', fmtDate(new Date()))}
${r('  Durasi', fmtDur(Date.now() - START_TIME))}
│${''.padEnd(W - 2)}│
${bot}
`);

const END_DATE = new Date();
console.log(`🎉 Full scenario v2 selesai! | Mulai: ${fmtDate(START_DATE)} | Selesai: ${fmtDate(END_DATE)} | Durasi: ${fmtDur(Date.now() - START_TIME)}`);
