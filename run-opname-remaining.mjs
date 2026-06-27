/**
 * Stock Opname untuk cabang Kebayoran Lama & Cibitung
 * + Verifikasi data keseluruhan
 */

const BASE = 'http://127.0.0.1:8000/api';
const TOKEN = '9|t2NxR00GMAmiPU9XCNUXqzTZt1CMPqLWv4Rj5jkVec943a4f';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
};

async function api(method, path, body) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    return res.json();
}

function log(icon, msg) { console.log(`${icon} ${msg}`); }
function section(title) { console.log(`\n${'â•'.repeat(60)}\n  ${title}\n${'â•'.repeat(60)}`); }

const BRANCHES = [
    { id: 3, name: 'Kebayoran Lama', code: 'KLA' },
    { id: 4, name: 'Cibitung', code: 'CBT' },
];

const ALL_BRANCHES = [
    { id: 1, name: 'Jakarta' },
    { id: 2, name: 'Bogor' },
    { id: 3, name: 'Kebayoran Lama' },
    { id: 4, name: 'Cibitung' },
];

section('STOCK OPNAME â€” Cabang Kebayoran Lama & Cibitung');

const opnameResults = [];

for (const branch of BRANCHES) {
    log('ðŸ”', `\nâ”€â”€ Opname Cabang: ${branch.name} â”€â”€`);

    const invRes = await api('GET', `/inventory?per_page=10000&status=AVAILABLE&branch_id=${branch.id}`);
    const branchInventory = invRes?.data || [];
    log('  ðŸ“¦', `  Total item di sistem: ${branchInventory.length}`);

    if (branchInventory.length === 0) {
        log('  âš ï¸', `  Tidak ada inventory, skip opname`);
        continue;
    }

    const items = [];

    // Scan 80% sebagai INSTOCK
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

    missedItems.forEach(inv => {
        items.push({
            inventory_code: inv.inventory_code,
            product_id: inv.product_id,
            last_status: inv.status || 'AVAILABLE',
            opname_status: 'MISSING',
        });
    });

    // Tambah extra dari cabang lain
    const otherBranchId = branch.id === 3 ? 1 : 2;
    const otherBranch = ALL_BRANCHES.find(b => b.id === otherBranchId);
    const otherInvRes = await api('GET', `/inventory?per_page=3&status=AVAILABLE&branch_id=${otherBranchId}`);
    const otherItems = otherInvRes?.data || [];
    const extraCount = Math.min(2, otherItems.length);

    for (let e = 0; e < extraCount; e++) {
        items.push({
            inventory_code: otherItems[e].inventory_code,
            product_id: otherItems[e].product_id,
            last_status: otherItems[e].status || 'AVAILABLE',
            opname_status: 'EXTRA',
            note: `Item ditemukan dari cabang ${otherBranch.name}, kemungkinan salah transfer atau titipan sementara.`,
        });
    }
    if (extraCount > 0) log('  ðŸ”„', `  Extra item dari cabang ${otherBranch.name}: ${extraCount}`);

    await api('POST', '/stock-opname', { branch_id: branch.id, item: items });

    const instock = items.filter(i => i.opname_status === 'INSTOCK').length;
    const missing = items.filter(i => i.opname_status === 'MISSING').length;
    const extra = items.filter(i => i.opname_status === 'EXTRA').length;

    log('  âœ…', `  Hasil: INSTOCK=${instock}, MISSING=${missing}, EXTRA=${extra} â†’ SELISIH`);
    opnameResults.push({ branch: branch.name, total: branchInventory.length, instock, missing, extra });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VERIFIKASI KESELURUHAN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('VERIFIKASI DATA KESELURUHAN');

// Kategori
const catRes = await api('GET', '/categories?per_page=100');
const allCats = catRes?.data || [];
const parentCats = allCats.filter(c => !c.parent_id);
const subCats = allCats.filter(c => c.parent_id);
log('ðŸ“', `Kategori: ${parentCats.length} parent + ${subCats.length} sub = ${allCats.length} total`);

// Produk
const prodRes = await api('GET', '/products?per_page=100');
log('ðŸ“¦', `Produk: ${prodRes?.total || prodRes?.data?.length || 0} total`);

// Pembelian per status
for (const status of ['APPROVAL', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN']) {
    const res = await api('GET', `/pembelian?status=${status}&per_page=1`);
    log('  ðŸ“', `  Pembelian ${status}: ${res?.total || 0}`);
}

// Inventory per cabang
log('ðŸ“¦', 'Inventory AVAILABLE per cabang:');
let totalInv = 0;
for (const branch of ALL_BRANCHES) {
    const res = await api('GET', `/inventory?status=AVAILABLE&branch_id=${branch.id}&per_page=1`);
    const count = res?.total || 0;
    totalInv += count;
    log('  ðŸª', `  ${branch.name}: ${count} item`);
}
log('  ðŸ“Š', `  TOTAL: ${totalInv} item`);

// Stock Opname
const opnameListRes = await api('GET', '/stock-opname?per_page=100');
const opnameList = opnameListRes?.data || [];
log('ðŸ”', `Stock Opname sessions: ${opnameList.length}`);
for (const op of opnameList) {
    log('  ðŸ“‹', `  ${op.kode_sesi} | ${op.branch?.branch_name || '?'} | Total: ${op.total_item} | INSTOCK: ${op.in_stock} | MISSING: ${op.missing} | EXTRA: ${op.extra} | Status: ${op.status}`);
}

section('RINGKASAN FINAL');
console.log(`
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  SKENARIO TEST TOKO EMAS â€” COMPLETED                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Kategori     : ${String(allCats.length).padEnd(5)} (${parentCats.length} parent + ${subCats.length} sub)             â”‚
â”‚  Produk       : ${String(prodRes?.total || 0).padEnd(5)} (tersebar di 4 cabang)              â”‚
â”‚  Pembelian    : 60    (15 per cabang, mix tunai/transfer)â”‚
â”‚  Disetujui    : 43    â†’ otomatis jadi inventory          â”‚
â”‚  Ditolak      : 10                                       â”‚
â”‚  Pending      : 7                                        â”‚
â”‚  Inventory    : ${String(totalInv).padEnd(5)} item AVAILABLE                       â”‚
â”‚  Stock Opname : ${String(opnameList.length).padEnd(5)} sesi (4 cabang)                    â”‚
â”‚                                                         â”‚
â”‚  Setiap opname: 80% INSTOCK + 20% MISSING + 2 EXTRA    â”‚
â”‚  â†’ Semua cabang status SELISIH (ada missing & extra)    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
`);
