/**
 * SKENARIO TEST LENGKAP — Toko Emas
 *
 * 1. Buat 20 kategori (2 parent + 18 sub, 9 per parent)
 * 2. Buat 10 produk tersebar di 4 cabang
 * 3. Buat 60 pembelian (15 per cabang, mix tunai/transfer)
 * 4. Approve 50% pembelian → inventory terbentuk
 * 5. Jalankan stock opname per cabang (scan item + extra cross-branch)
 */

const BASE = 'http://127.0.0.1:8000/api';
const TOKEN = '1|t6PvZnwzOdKQipycHRIvwNc5A8wQGd9WY16zeUoK0b6daecc';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
};

async function api(method, path, body) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok && res.status !== 422) {
        console.error(`❌ ${method} ${path} → ${res.status}`, data?.message || '');
    }
    return data;
}

function log(icon, msg) { console.log(`${icon} ${msg}`); }
function section(title) { console.log(`\n${'═'.repeat(60)}\n  ${title}\n${'═'.repeat(60)}`); }

// Existing data
const BRANCHES = [
    { id: 1, name: 'Jakarta', code: 'DKIJKT', bank_cabang_id: 1 },
    { id: 2, name: 'Bogor', code: 'BGR-1', bank_cabang_id: 4 },
    { id: 3, name: 'Kebayoran Lama', code: 'KLA', bank_cabang_id: 3 },
    { id: 4, name: 'Cibitung', code: 'CBT', bank_cabang_id: 5 },
];

// ═══════════════════════════════════════════════
// STEP 1: KATEGORI (2 parent + 18 sub = 20 total)
// ═══════════════════════════════════════════════
section('STEP 1: Buat 20 Kategori (2 Parent + 18 Sub Kategori)');

const parentCategories = [
    { category_name: 'Perhiasan Emas', description: 'Kategori perhiasan emas murni', category_code: 'PE' },
    { category_name: 'Logam Mulia', description: 'Kategori logam mulia batangan dan koin', category_code: 'LM' },
];

const subCategoryNames = [
    // 9 sub untuk Perhiasan Emas
    ['Cincin Nikah', 'Kalung Rantai', 'Gelang Tangan', 'Anting-Anting', 'Liontin Hati', 'Bros Emas', 'Gelang Kaki', 'Tiara Emas', 'Peniti Emas'],
    // 9 sub untuk Logam Mulia
    ['Batangan 1gr', 'Batangan 5gr', 'Batangan 10gr', 'Batangan 25gr', 'Batangan 50gr', 'Koin Emas 1gr', 'Koin Emas 5gr', 'Koin Perak 10gr', 'Koin Perak 50gr'],
];

const subCategoryCodes = [
    ['CN', 'KR', 'GT', 'AA', 'LH', 'BE', 'GK', 'TE', 'PNE'],
    ['B1', 'B5', 'B10', 'B25', 'B50', 'K1', 'K5', 'KP10', 'KP50'],
];

const createdParents = [];
const createdSubs = [];

for (let i = 0; i < parentCategories.length; i++) {
    const p = parentCategories[i];
    const res = await api('POST', '/categories', p);
    const parentId = res?.data?.id || res?.id;
    createdParents.push({ ...p, id: parentId });
    log('📁', `Parent: ${p.category_name} (ID: ${parentId})`);

    for (let j = 0; j < 9; j++) {
        const sub = {
            category_name: subCategoryNames[i][j],
            description: `${subCategoryNames[i][j]} - ${p.category_name}`,
            category_code: subCategoryCodes[i][j],
            parent_id: parentId,
        };
        const subRes = await api('POST', '/categories', sub);
        const subId = subRes?.data?.id || subRes?.id;
        createdSubs.push({ ...sub, id: subId, parentIndex: i });
        log('  📄', `  Sub: ${sub.category_name} (ID: ${subId})`);
    }
}

log('✅', `Total kategori dibuat: ${createdParents.length} parent + ${createdSubs.length} sub = ${createdParents.length + createdSubs.length}`);

// ═══════════════════════════════════════════════
// STEP 2: PRODUK (10 produk, tersebar di 4 cabang)
// ═══════════════════════════════════════════════
section('STEP 2: Buat 10 Produk Tersebar di 4 Cabang');

const productDefs = [
    { name: 'Cincin Nikah Polos 2gr',     subIdx: 0, karatDefault: 24, beratDefault: 2.0 },
    { name: 'Kalung Rantai Italy 5gr',    subIdx: 1, karatDefault: 22, beratDefault: 5.0 },
    { name: 'Gelang Tangan Ukir 8gr',     subIdx: 2, karatDefault: 22, beratDefault: 8.0 },
    { name: 'Anting Gantung Mutiara 1gr', subIdx: 3, karatDefault: 18, beratDefault: 1.0 },
    { name: 'Liontin Hati Mini 1.5gr',    subIdx: 4, karatDefault: 24, beratDefault: 1.5 },
    { name: 'Batangan Antam 1gr',         subIdx: 9, karatDefault: 24, beratDefault: 1.0 },
    { name: 'Batangan Antam 5gr',         subIdx: 10, karatDefault: 24, beratDefault: 5.0 },
    { name: 'Batangan Antam 10gr',        subIdx: 11, karatDefault: 24, beratDefault: 10.0 },
    { name: 'Koin Emas 1gr',             subIdx: 14, karatDefault: 24, beratDefault: 1.0 },
    { name: 'Gelang Kaki Emas 3gr',       subIdx: 6, karatDefault: 18, beratDefault: 3.0 },
];

// Distribusi cabang: produk 0-2 → 4 cabang, produk 3-5 → 3 cabang, produk 6-9 → 2 cabang
const branchDistribution = [
    [1, 2, 3, 4],  // Cincin Nikah → semua cabang
    [1, 2, 3, 4],  // Kalung Rantai → semua cabang
    [1, 2, 3, 4],  // Gelang Tangan → semua cabang
    [1, 2, 3],     // Anting → 3 cabang
    [1, 2, 4],     // Liontin → 3 cabang
    [1, 3, 4],     // Batangan 1gr → 3 cabang
    [1, 2],        // Batangan 5gr → 2 cabang
    [2, 4],        // Batangan 10gr → 2 cabang
    [1, 3],        // Koin Emas → 2 cabang
    [2, 3, 4],     // Gelang Kaki → 3 cabang
];

const createdProducts = [];

for (let i = 0; i < productDefs.length; i++) {
    const p = productDefs[i];
    const sub = createdSubs[p.subIdx];
    const parentCat = createdParents[sub.parentIndex];

    const body = {
        product_name: p.name,
        category_id: sub.id,
        subcategory_id: sub.id,
        barcode: sub.category_code,
        description: `${p.name} ${p.karatDefault}K`,
        branch_id: branchDistribution[i],
        is_active: 1,
    };

    const res = await api('POST', '/products', body);
    const prodId = res?.data?.id;
    const barcode = res?.data?.barcode;
    createdProducts.push({ id: prodId, barcode, ...p, categoryId: parentCat.id, subcategoryId: sub.id, branches: branchDistribution[i] });
    const branchNames = branchDistribution[i].map(bid => BRANCHES.find(b => b.id === bid)?.name).join(', ');
    log('📦', `${p.name} (ID: ${prodId}, barcode: ${barcode}) → [${branchNames}]`);
}

log('✅', `Total produk dibuat: ${createdProducts.length}`);

// ═══════════════════════════════════════════════
// STEP 3: PEMBELIAN (60 total, 15 per cabang)
// ═══════════════════════════════════════════════
section('STEP 3: Buat 60 Pembelian (15 per Cabang)');

const allPembelian = [];
let pembelianCount = 0;

for (const branch of BRANCHES) {
    const branchProducts = createdProducts.filter(p => p.branches.includes(branch.id));
    if (branchProducts.length === 0) continue;

    log('🏪', `\nCabang: ${branch.name} (${branchProducts.length} produk tersedia)`);

    // Buat 15 pembelian per cabang, dalam batch-batch kecil (3-5 item per batch)
    const batchSizes = [5, 5, 5]; // 3 batch × 5 = 15
    let itemIdx = 0;

    for (let batchNum = 0; batchNum < batchSizes.length; batchNum++) {
        const batchSize = batchSizes[batchNum];
        const items = [];

        for (let j = 0; j < batchSize; j++) {
            const prod = branchProducts[itemIdx % branchProducts.length];
            const isTunai = (itemIdx + batchNum) % 3 === 0; // ~33% tunai, ~67% transfer
            const baseModal = 500000 + (prod.beratDefault * 1000000);
            const modal = baseModal + (Math.floor(Math.random() * 500) * 1000);
            const jual = modal + Math.floor(modal * (0.1 + Math.random() * 0.15));

            items.push({
                branch_id: branch.id,
                product_id: prod.id,
                category_id: prod.categoryId,
                subcategory_id: prod.subcategoryId,
                tipe_pembayaran: isTunai ? 'TUNAI' : 'TRANSFER',
                bank_cabang_id: isTunai ? null : branch.bank_cabang_id,
                supplier_id: (itemIdx % 2) + 1,
                barcode: prod.barcode,
                serial_number: `SN-${branch.code}-${String(pembelianCount + j + 1).padStart(3, '0')}`,
                berat: prod.beratDefault + (Math.random() * 0.5).toFixed(2) * 1,
                karat: prod.karatDefault,
                modal,
                jual,
            });
            itemIdx++;
        }

        const res = await api('POST', '/pembelian', { data: items });
        const created = res?.data || [];
        created.forEach(c => allPembelian.push(c));
        pembelianCount += batchSize;

        const tunaiCount = items.filter(i => i.tipe_pembayaran === 'TUNAI').length;
        const transferCount = items.filter(i => i.tipe_pembayaran === 'TRANSFER').length;
        log('  📝', `  Batch ${batchNum + 1}: ${batchSize} item (${tunaiCount} tunai, ${transferCount} transfer) → Batch ID: ${created[0]?.batch || '?'}`);
    }
}

log('✅', `Total pembelian dibuat: ${allPembelian.length}`);

// Summary per cabang
for (const branch of BRANCHES) {
    const branchItems = allPembelian.filter(p => p.branch_id === branch.id);
    const tunai = branchItems.filter(p => p.tipe_pembayaran === 'TUNAI').length;
    const transfer = branchItems.filter(p => p.tipe_pembayaran === 'TRANSFER').length;
    log('  📊', `  ${branch.name}: ${branchItems.length} item (${tunai} tunai, ${transfer} transfer)`);
}

// ═══════════════════════════════════════════════
// STEP 4: APPROVE 50% PEMBELIAN → INVENTORY
// ═══════════════════════════════════════════════
section('STEP 4: Approve 50% Pembelian (30 dari 60)');

const approveCount = Math.ceil(allPembelian.length * 0.5);
const toApprove = allPembelian.slice(0, approveCount);
const notApproved = allPembelian.slice(approveCount);

// Approve per cabang agar merata
const approveByBranch = {};
toApprove.forEach(p => {
    if (!approveByBranch[p.branch_id]) approveByBranch[p.branch_id] = [];
    approveByBranch[p.branch_id].push(p.id);
});

for (const [branchId, ids] of Object.entries(approveByBranch)) {
    const branch = BRANCHES.find(b => b.id == branchId);
    const res = await api('POST', '/update-pembelian', {
        status: 'DISETUJUI',
        pembelian_ids: ids,
    });
    log('✅', `${branch.name}: ${ids.length} pembelian disetujui`);
}

// Tolak beberapa item (10% dari sisa)
const rejectCount = Math.ceil(notApproved.length * 0.33);
const toReject = notApproved.slice(0, rejectCount);
if (toReject.length > 0) {
    const rejectIds = toReject.map(p => p.id);
    await api('POST', '/update-pembelian', {
        status: 'DITOLAK',
        pembelian_ids: rejectIds,
        note: 'Karat tidak sesuai dengan dokumen pembelian. Mohon periksa kembali.',
    });
    log('❌', `${rejectIds.length} pembelian ditolak`);
}

// Verify inventory
const inventoryRes = await api('GET', '/inventory?per_page=100&status=AVAILABLE');
const totalInventory = inventoryRes?.total || inventoryRes?.data?.length || 0;
log('📦', `Total inventory AVAILABLE: ${totalInventory}`);

for (const branch of BRANCHES) {
    const branchInv = await api('GET', `/inventory?per_page=100&status=AVAILABLE&branch_id=${branch.id}`);
    log('  📊', `  ${branch.name}: ${branchInv?.total || branchInv?.data?.length || 0} item inventory`);
}

// ═══════════════════════════════════════════════
// STEP 5: STOCK OPNAME — AUDIT PER CABANG
// ═══════════════════════════════════════════════
section('STEP 5: Stock Opname (Audit) Per Cabang');

const opnameResults = [];

for (const branch of BRANCHES) {
    log('🔍', `\n── Opname Cabang: ${branch.name} ──`);

    // Ambil semua inventory AVAILABLE di cabang ini
    const invRes = await api('GET', `/inventory?per_page=10000&status=AVAILABLE&branch_id=${branch.id}`);
    const branchInventory = invRes?.data || [];
    log('  📦', `  Total item di sistem: ${branchInventory.length}`);

    if (branchInventory.length === 0) {
        log('  ⚠️', `  Tidak ada inventory, skip opname`);
        continue;
    }

    const items = [];

    // Scan 80% item sebagai INSTOCK (ditemukan)
    const scanCount = Math.ceil(branchInventory.length * 0.8);
    const scannedItems = branchInventory.slice(0, scanCount);
    const missedItems = branchInventory.slice(scanCount);

    scannedItems.forEach(inv => {
        items.push({
            inventory_code: inv.inventory_code,
            product_id: inv.product_id,
            last_status: inv.status || 'AVAILABLE',
            opname_status: 'INSTOCK',
        });
    });

    // Item yang tidak di-scan → MISSING
    missedItems.forEach(inv => {
        items.push({
            inventory_code: inv.inventory_code,
            product_id: inv.product_id,
            last_status: inv.status || 'AVAILABLE',
            opname_status: 'MISSING',
        });
    });

    // Tambah 1-2 EXTRA item (ambil dari cabang lain)
    const otherBranch = BRANCHES.find(b => b.id !== branch.id);
    if (otherBranch) {
        const otherInvRes = await api('GET', `/inventory?per_page=5&status=AVAILABLE&branch_id=${otherBranch.id}`);
        const otherItems = otherInvRes?.data || [];
        const extraCount = Math.min(2, otherItems.length);

        for (let e = 0; e < extraCount; e++) {
            items.push({
                inventory_code: otherItems[e].inventory_code,
                product_id: otherItems[e].product_id,
                last_status: otherItems[e].status || 'AVAILABLE',
                opname_status: 'EXTRA',
                note: `Item ditemukan dari cabang ${otherBranch.name}, kemungkinan salah kirim atau titipan.`,
            });
        }
        if (extraCount > 0) log('  🔄', `  Extra item dari cabang ${otherBranch.name}: ${extraCount}`);
    }

    // Submit opname
    const opnameRes = await api('POST', '/stock-opname', {
        branch_id: branch.id,
        item: items,
    });

    const instock = items.filter(i => i.opname_status === 'INSTOCK').length;
    const missing = items.filter(i => i.opname_status === 'MISSING').length;
    const extra = items.filter(i => i.opname_status === 'EXTRA').length;
    const status = missing === 0 && extra === 0 ? 'SESUAI' : 'SELISIH';

    log('  ✅', `  Hasil: INSTOCK=${instock}, MISSING=${missing}, EXTRA=${extra} → ${status}`);
    opnameResults.push({ branch: branch.name, total: branchInventory.length, instock, missing, extra, status });
}

// ═══════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════
section('RINGKASAN AKHIR');

log('📁', `Kategori: ${createdParents.length} parent + ${createdSubs.length} sub = ${createdParents.length + createdSubs.length}`);
log('📦', `Produk: ${createdProducts.length}`);
log('📝', `Pembelian: ${allPembelian.length} total`);
log('  ✅', `  Disetujui: ${toApprove.length}`);
log('  ❌', `  Ditolak: ${toReject.length}`);
log('  ⏳', `  Pending: ${notApproved.length - toReject.length}`);
log('📦', `Inventory terbentuk: ${totalInventory}`);
log('🔍', `Stock Opname:`);
opnameResults.forEach(r => {
    log('  📊', `  ${r.branch}: ${r.total} item → INSTOCK=${r.instock}, MISSING=${r.missing}, EXTRA=${r.extra} [${r.status}]`);
});

console.log('\n🎉 Semua skenario test berhasil dijalankan!');
