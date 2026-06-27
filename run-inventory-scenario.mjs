/**
 * SKENARIO INVENTORY â€” Transfer Item, Remove Item (Hilang & Repair), Return Repair
 *
 * Prerequisites: run-full-scenario.mjs sudah dijalankan (ada inventory AVAILABLE)
 *
 * Flow:
 * 1. Transfer Item: Jakarta â†’ Bogor (2 item), approve
 * 2. Transfer Item: Bogor â†’ Cibitung (1 item), tolak â†’ item kembali
 * 3. Transfer Item: Keb.Lama â†’ Jakarta (1 item), batalkan â†’ item kembali
 * 4. Remove Item (HILANG): 1 item dari Jakarta, approve â†’ status LOST
 * 5. Remove Item (REPAIR): 2 item dari Bogor, approve â†’ status REPAIR
 * 6. Remove Item (REPAIR): Return 1 item repair â†’ kembali AVAILABLE
 * 7. Remove Item (HILANG): tolak â†’ item tetap AVAILABLE
 * 8. Stock opname setelah semua perubahan
 */

const BASE = 'http://127.0.0.1:8000/api';
const TOKEN = '9|t2NxR00GMAmiPU9XCNUXqzTZt1CMPqLWv4Rj5jkVec943a4f';
const hdrs = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

async function api(method, path, body) {
    const opts = { method, headers: hdrs };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json();
    if (!res.ok) console.error(`  âŒ ${method} ${path} â†’ ${res.status}`, json?.message || '');
    return json;
}
async function apiData(method, path, body) { const j = await api(method, path, body); return j?.data ?? j; }

function log(i, m) { console.log(`${i} ${m}`); }
function section(t) { console.log(`\n${'â•'.repeat(65)}\n  ${t}\n${'â•'.repeat(65)}`); }

const BRANCHES = [
    { id: 1, name: 'Jakarta' },
    { id: 2, name: 'Bogor' },
    { id: 3, name: 'Kebayoran Lama' },
    { id: 4, name: 'Cibitung' },
];

async function getAvailable(branchId) {
    const res = await api('GET', `/inventory?per_page=10000&status=AVAILABLE&branch_id=${branchId}`);
    return res?.data || [];
}

async function getInvByStatus(status) {
    const res = await api('GET', `/inventory?per_page=10000&status=${status}`);
    return res?.data || [];
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Cek state awal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STATE AWAL');
for (const br of BRANCHES) {
    const inv = await getAvailable(br.id);
    log('ðŸ“¦', `${br.name}: ${inv.length} item AVAILABLE`);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 1: TRANSFER ITEM â€” Jakarta â†’ Bogor (2 item, APPROVE)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 1: Transfer Jakarta â†’ Bogor (2 item) + Approve');

const jktInv = await getAvailable(1);
const transferItems1 = jktInv.slice(0, 2);

const trf1 = await api('POST', '/transfer-item', {
    branch_source_id: 1,
    branch_dest_id: 2,
    item: transferItems1.map(i => ({ inventory_code: i.inventory_code, product_id: i.product_id })),
});
log('ðŸ“¤', `Transfer dibuat: ${transferItems1.map(i => i.inventory_code).join(', ')}`);

// Verify item jadi TRANSIT
for (const item of transferItems1) {
    const inv = await apiData('GET', `/inventory/${item.id}`);
    log('  ðŸ”„', `  ${item.inventory_code}: status = ${inv?.data?.status || inv?.status}`);
}

// Get transfer ID
const trfList1 = await api('GET', '/transfer-item?per_page=1');
const trfId1 = trfList1?.data?.[0]?.id;

// Approve transfer
await api('PUT', '/update-transfer-item', { transfer_item_id: trfId1, status: 'DISETUJUI' });
log('âœ…', `Transfer #${trfId1} disetujui`);

// Verify: item pindah ke Bogor
for (const item of transferItems1) {
    const inv = await apiData('GET', `/inventory/${item.id}`);
    const d = inv?.data || inv;
    log('  ðŸ“¦', `  ${item.inventory_code}: status=${d?.status}, branch_id=${d?.branch_id} (Bogor=2)`);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 2: TRANSFER ITEM â€” Bogor â†’ Cibitung (1 item, TOLAK)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 2: Transfer Bogor â†’ Cibitung (1 item) + Tolak');

const bgrInv = await getAvailable(2);
const transferItems2 = bgrInv.slice(0, 1);

await api('POST', '/transfer-item', {
    branch_source_id: 2,
    branch_dest_id: 4,
    item: transferItems2.map(i => ({ inventory_code: i.inventory_code, product_id: i.product_id })),
});
log('ðŸ“¤', `Transfer dibuat: ${transferItems2[0].inventory_code}`);

const trfList2 = await api('GET', '/transfer-item?per_page=1');
const trfId2 = trfList2?.data?.[0]?.id;

// Verify TRANSIT
const invCheck = await apiData('GET', `/inventory/${transferItems2[0].id}`);
log('  ðŸ”„', `  Status: ${(invCheck?.data || invCheck)?.status} (harusnya TRANSIT)`);

// Tolak â†’ item kembali AVAILABLE di Bogor
await api('PUT', '/update-transfer-item', { transfer_item_id: trfId2, status: 'DIBATALKAN', note: 'Stok cabang tujuan sudah cukup' });
log('âŒ', `Transfer #${trfId2} dibatalkan`);

const invAfter = await apiData('GET', `/inventory/${transferItems2[0].id}`);
const d2 = invAfter?.data || invAfter;
log('  ðŸ“¦', `  ${transferItems2[0].inventory_code}: status=${d2?.status} (harusnya AVAILABLE), branch=${d2?.branch_id} (Bogor=2)`);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 3: TRANSFER ITEM â€” Keb.Lama â†’ Jakarta (1 item, BATALKAN)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 3: Transfer Keb.Lama â†’ Jakarta (1 item) + Batalkan');

const klaInv = await getAvailable(3);
if (klaInv.length > 0) {
    const transferItems3 = klaInv.slice(0, 1);
    await api('POST', '/transfer-item', {
        branch_source_id: 3,
        branch_dest_id: 1,
        item: transferItems3.map(i => ({ inventory_code: i.inventory_code, product_id: i.product_id })),
    });
    log('ðŸ“¤', `Transfer dibuat: ${transferItems3[0].inventory_code}`);

    const trfList3 = await api('GET', '/transfer-item?per_page=1');
    const trfId3 = trfList3?.data?.[0]?.id;

    await api('PUT', '/update-transfer-item', { transfer_item_id: trfId3, status: 'DIBATALKAN', note: 'Salah input item' });
    log('âŒ', `Transfer #${trfId3} dibatalkan â†’ item kembali AVAILABLE di Keb.Lama`);
} else {
    log('âš ï¸', 'Keb.Lama: 0 item, skip transfer');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 4: REMOVE ITEM â€” HILANG (1 item Jakarta, APPROVE)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 4: Remove Item (HILANG) â€” 1 item Jakarta + Approve');

const jktInv2 = await getAvailable(1);
const lostItem = jktInv2[0];

await api('POST', '/remove-item', {
    branch_id: 1,
    jenis: 'HILANG',
    note: 'Item tidak ditemukan saat pengecekan rutin, kemungkinan tertukar atau hilang.',
    item: [{ inventory_code: lostItem.inventory_code, product_id: lostItem.product_id }],
});
log('ðŸ“‹', `Remove (HILANG) dibuat: ${lostItem.inventory_code}`);

const rmvList1 = await api('GET', '/remove-item?per_page=1');
const rmvId1 = rmvList1?.data?.[0]?.id;

await api('PUT', '/update-remove-item', { remove_id: rmvId1, status: 'DISETUJUI' });
log('âœ…', `Remove #${rmvId1} disetujui â†’ item LOST`);

const lostCheck = await apiData('GET', `/inventory/${lostItem.id}`);
log('  ðŸ“¦', `  ${lostItem.inventory_code}: status = ${(lostCheck?.data || lostCheck)?.status}`);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 5: REMOVE ITEM â€” REPAIR (2 item Bogor, APPROVE)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 5: Remove Item (REPAIR) â€” 2 item Bogor + Approve');

const bgrInv2 = await getAvailable(2);
const repairItems = bgrInv2.slice(0, 2);

await api('POST', '/remove-item', {
    branch_id: 2,
    jenis: 'REPAIR',
    note: 'Item perlu diperbaiki: solder lepas dan perlu poles ulang.',
    item: repairItems.map(i => ({ inventory_code: i.inventory_code, product_id: i.product_id })),
});
log('ðŸ”§', `Remove (REPAIR) dibuat: ${repairItems.map(i => i.inventory_code).join(', ')}`);

const rmvList2 = await api('GET', '/remove-item?per_page=1');
const rmvId2 = rmvList2?.data?.[0]?.id;

await api('PUT', '/update-remove-item', { remove_id: rmvId2, status: 'DISETUJUI' });
log('âœ…', `Remove #${rmvId2} disetujui â†’ item REPAIR`);

for (const item of repairItems) {
    const check = await apiData('GET', `/inventory/${item.id}`);
    log('  ðŸ”§', `  ${item.inventory_code}: status = ${(check?.data || check)?.status}`);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 6: RETURN REPAIR (1 item kembali ke AVAILABLE)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 6: Return 1 Item dari Repair â†’ AVAILABLE');

// Buat remove baru untuk return, atau update status existing?
// Controller: status RETURN â†’ inventory kembali AVAILABLE
await api('PUT', '/update-remove-item', { remove_id: rmvId2, status: 'RETURN', note: 'Item pertama selesai diperbaiki, dikembalikan ke inventory.' });
log('ðŸ”„', `Remove #${rmvId2} status â†’ RETURN`);

// Note: RETURN di controller set SEMUA item di remove tersebut ke AVAILABLE
// Cek status item
for (const item of repairItems) {
    const check = await apiData('GET', `/inventory/${item.id}`);
    log('  ðŸ“¦', `  ${item.inventory_code}: status = ${(check?.data || check)?.status}`);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 7: REMOVE ITEM â€” HILANG (1 item Cibitung, TOLAK)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 7: Remove Item (HILANG) â€” 1 item Cibitung + Tolak');

const cbtInv = await getAvailable(4);
if (cbtInv.length > 0) {
    const rejectItem = cbtInv[0];
    await api('POST', '/remove-item', {
        branch_id: 4,
        jenis: 'HILANG',
        note: 'Dilaporkan hilang oleh kasir.',
        item: [{ inventory_code: rejectItem.inventory_code, product_id: rejectItem.product_id }],
    });

    const rmvList3 = await api('GET', '/remove-item?per_page=1');
    const rmvId3 = rmvList3?.data?.[0]?.id;

    await api('PUT', '/update-remove-item', { remove_id: rmvId3, status: 'DITOLAK', note: 'Item ditemukan kembali di rak belakang.' });
    log('âŒ', `Remove #${rmvId3} ditolak â†’ ${rejectItem.inventory_code} tetap AVAILABLE`);

    const checkReject = await apiData('GET', `/inventory/${rejectItem.id}`);
    log('  ðŸ“¦', `  Status: ${(checkReject?.data || checkReject)?.status}`);
} else {
    log('âš ï¸', 'Cibitung: 0 item, skip');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STEP 8: STOCK OPNAME SETELAH SEMUA PERUBAHAN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('STEP 8: Stock Opname setelah Transfer/Remove/Repair');

const opnameResults = [];
for (const br of BRANCHES) {
    const inv = await getAvailable(br.id);
    if (!inv.length) { log('âš ï¸', `${br.name}: 0 AVAILABLE, skip`); continue; }

    const items = [];
    // Scan semua yang AVAILABLE
    inv.forEach(i => items.push({ inventory_code: i.inventory_code, product_id: i.product_id, last_status: i.status, opname_status: 'INSTOCK' }));

    await api('POST', '/stock-opname', { branch_id: br.id, item: items });
    log('ðŸ”', `${br.name}: ${inv.length} item INSTOCK â†’ SESUAI`);
    opnameResults.push({ branch: br.name, total: inv.length, instock: inv.length, missing: 0, extra: 0 });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SUMMARY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
section('RINGKASAN INVENTORY SCENARIO');

const available = await getInvByStatus('AVAILABLE');
const transit = await getInvByStatus('TRANSIT');
const sold = await getInvByStatus('SOLD');
const repair = await getInvByStatus('REPAIR');
const lost = await getInvByStatus('LOST');

const trfAll = (await api('GET', '/transfer-item?per_page=100'))?.data || [];
const rmvAll = (await api('GET', '/remove-item?per_page=100'))?.data || [];
const opnAll = (await api('GET', '/stock-opname?per_page=100'))?.data || [];

console.log(`
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              INVENTORY SCENARIO â€” RINGKASAN                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                               â”‚
â”‚  ðŸ“¤ TRANSFER ITEM                                             â”‚
â”‚     Total pengajuan : ${String(trfAll.length).padEnd(3)}                                       â”‚
â”‚     Disetujui       : ${String(trfAll.filter(t => t.status === 'DISETUJUI').length).padEnd(3)} (Jakartaâ†’Bogor: 2 item)                â”‚
â”‚     Dibatalkan      : ${String(trfAll.filter(t => t.status === 'DIBATALKAN').length).padEnd(3)} (item kembali ke cabang asal)          â”‚
â”‚                                                               â”‚
â”‚  ðŸ—‘ï¸  REMOVE ITEM                                              â”‚
â”‚     Total pengajuan : ${String(rmvAll.length).padEnd(3)}                                       â”‚
â”‚     HILANG approved : ${String(rmvAll.filter(r => r.jenis === 'HILANG' && r.status === 'DISETUJUI').length).padEnd(3)} â†’ inventory LOST                       â”‚
â”‚     REPAIR approved : ${String(rmvAll.filter(r => r.jenis === 'REPAIR' && (r.status === 'DISETUJUI' || r.status === 'RETURN')).length).padEnd(3)} â†’ inventory REPAIR â†’ RETURN           â”‚
â”‚     Ditolak         : ${String(rmvAll.filter(r => r.status === 'DITOLAK').length).padEnd(3)} (item tetap AVAILABLE)                â”‚
â”‚                                                               â”‚
â”‚  ðŸ“¦ STATUS INVENTORY                                          â”‚
â”‚     AVAILABLE  : ${String(available.length).padEnd(3)}                                        â”‚
â”‚     TRANSIT    : ${String(transit.length).padEnd(3)}                                        â”‚
â”‚     SOLD       : ${String(sold.length).padEnd(3)}                                        â”‚
â”‚     REPAIR     : ${String(repair.length).padEnd(3)}                                        â”‚
â”‚     LOST       : ${String(lost.length).padEnd(3)}                                        â”‚
â”‚     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                                            â”‚
â”‚     TOTAL      : ${String(available.length + transit.length + sold.length + repair.length + lost.length).padEnd(3)}                                        â”‚
â”‚                                                               â”‚
â”‚  ðŸ“¦ AVAILABLE per Cabang                                      â”‚
${(await Promise.all(BRANCHES.map(async br => {
    const inv = await getAvailable(br.id);
    return `â”‚     ${br.name.padEnd(16)}: ${String(inv.length).padEnd(3)}                                     â”‚`;
}))).join('\n')}
â”‚                                                               â”‚
â”‚  ðŸ” STOCK OPNAME (post-inventory changes)                     â”‚
â”‚     Sessions   : ${String(opnAll.length).padEnd(3)}                                       â”‚
${opnameResults.map(r =>
`â”‚     ${r.branch.padEnd(16)}: ${String(r.total).padEnd(2)} item â†’ SESUAI                   â”‚`
).join('\n')}
â”‚                                                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
`);

console.log('ðŸŽ‰ Inventory scenario selesai!');
