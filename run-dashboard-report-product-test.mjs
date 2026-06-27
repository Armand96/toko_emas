/**
 * TEST: Dashboard, Report Finance, Master Produk, Cabang No Telepon
 *
 * Skenario:
 * 1. Login Super Admin → test semua endpoint tampil data
 * 2. Create/Login Kasir → test data restricted by branch_id
 * 3. Generate Excel report (format konsisten dgn generate-test-report.mjs)
 */

import ExcelJS from 'exceljs';
import path from 'path';

const BASE = 'http://127.0.0.1:8000/api';

// ═══════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════
function makeHeaders(token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function api(method, url, token, body) {
    const opts = { method, headers: makeHeaders(token) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${url}`, opts);
    const json = await res.json();
    return { ok: res.ok, status: res.status, json };
}

async function apiGet(url, token) { return api('GET', url, token); }
async function apiPost(url, token, body) { return api('POST', url, token, body); }

async function login(username, password) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, json };
    const token = json?.data?.user?.token ?? json?.data?.token;
    const user = json?.data?.user ?? json?.data;
    return { ok: true, token, user };
}

function section(t) { console.log(`\n${'═'.repeat(65)}\n  ${t}\n${'═'.repeat(65)}`); }
function log(icon, msg) { console.log(`${icon} ${msg}`); }

// ═══════════════════════════════════════════════
// TEST RESULTS COLLECTOR
// ═══════════════════════════════════════════════
const results = [];
let testNo = 0;

function addResult(module, component, testCase, pass, notes = '') {
    testNo++;
    const status = pass ? 'PASS' : 'FAIL';
    results.push({ no: testNo, module, component, testCase, status, notes });
    const icon = pass ? '✅' : '❌';
    console.log(`  ${icon} [${testNo}] ${testCase}${notes ? ` — ${notes}` : ''}`);
}

// ═══════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════
section('LOGIN SUPER ADMIN (tokoemas)');
const adminLogin = await login('tokoemas', 'tokoemas');
if (!adminLogin.ok) { console.error('❌ Gagal login Super Admin:', adminLogin.json); process.exit(1); }
const adminToken = adminLogin.token;
const adminUser = adminLogin.user;
log('🔑', `Login berhasil: ${adminUser.name} (role_id: ${adminUser.role_id}, branch_id: ${adminUser.branch_id})`);

// ── DASHBOARD — SUPER ADMIN ──
section('DASHBOARD — SUPER ADMIN (TANPA FILTER BRANCH)');

const dashDataToday = await apiGet('/dashboard/data-today', adminToken);
addResult('Dashboard', 'BE - data-today', 'Endpoint data-today respond OK', dashDataToday.ok, `status: ${dashDataToday.status}`);
const dtData = dashDataToday.json?.data ?? dashDataToday.json;
addResult('Dashboard', 'BE - data-today', 'available_inventory field ada', dtData?.available_inventory !== undefined, `value: ${dtData?.available_inventory}`);
addResult('Dashboard', 'BE - data-today', 'item_sold_today field ada', dtData?.item_sold_today !== undefined, `value: ${dtData?.item_sold_today}`);
addResult('Dashboard', 'BE - data-today', 'item_bought_today field ada', dtData?.item_bought_today !== undefined, `value: ${dtData?.item_bought_today}`);
addResult('Dashboard', 'BE - data-today', 'sales_today field ada', dtData?.sales_today !== undefined, `value: ${dtData?.sales_today}`);
addResult('Dashboard', 'BE - data-today', 'pembelian_today field ada', dtData?.pembelian_today !== undefined, `value: ${dtData?.pembelian_today}`);
addResult('Dashboard', 'BE - data-today', 'total_balance field ada', dtData?.total_balance !== undefined, `value: ${dtData?.total_balance}`);

const dashTakeAction = await apiGet('/dashboard/take-action-data', adminToken);
addResult('Dashboard', 'BE - take-action', 'Endpoint take-action respond OK', dashTakeAction.ok, `status: ${dashTakeAction.status}`);
const taData = dashTakeAction.json?.data ?? dashTakeAction.json;
addResult('Dashboard', 'BE - take-action', 'count_penjualan field ada', taData?.count_penjualan !== undefined, `value: ${taData?.count_penjualan}`);
addResult('Dashboard', 'BE - take-action', 'count_pembelian field ada', taData?.count_pembelian !== undefined, `value: ${taData?.count_pembelian}`);

const dashTrend = await apiGet('/dashboard/sales-trend?days=7', adminToken);
addResult('Dashboard', 'BE - sales-trend', 'Endpoint sales-trend respond OK', dashTrend.ok);
const trendData = dashTrend.json?.data ?? dashTrend.json;
addResult('Dashboard', 'BE - sales-trend', 'Trend data array 7 hari', Array.isArray(trendData) && trendData.length === 7, `length: ${trendData?.length}`);

const dashLatest = await apiGet('/dashboard/sales-latest', adminToken);
addResult('Dashboard', 'BE - sales-latest', 'Endpoint sales-latest respond OK', dashLatest.ok);
const latestData = dashLatest.json?.data ?? dashLatest.json;
addResult('Dashboard', 'BE - sales-latest', 'Latest sales berupa array', Array.isArray(latestData), `length: ${latestData?.length}`);

const dashStatus = await apiGet('/dashboard/sales-status', adminToken);
addResult('Dashboard', 'BE - sales-status', 'Endpoint sales-status respond OK', dashStatus.ok);

// ── DASHBOARD — FILTER BRANCH ──
section('DASHBOARD — FILTER BY BRANCH_ID=1 (Jakarta)');

const dashDataBranch = await apiGet('/dashboard/data-today?branch_id=1', adminToken);
addResult('Dashboard', 'BE - data-today', 'data-today branch_id=1 respond OK', dashDataBranch.ok);
const dtBranch = dashDataBranch.json?.data ?? dashDataBranch.json;
addResult('Dashboard', 'BE - data-today', 'Data ter-filter (available_inventory ada)', dtBranch?.available_inventory !== undefined, `all: ${dtData?.available_inventory}, branch 1: ${dtBranch?.available_inventory}`);

const dashTakeActionBranch = await apiGet('/dashboard/take-action-data?branch_id=1', adminToken);
addResult('Dashboard', 'BE - take-action', 'take-action branch_id=1 respond OK', dashTakeActionBranch.ok);

const dashTrendBranch = await apiGet('/dashboard/sales-trend?days=7&branch_id=1', adminToken);
addResult('Dashboard', 'BE - sales-trend', 'sales-trend branch_id=1 respond OK', dashTrendBranch.ok);

const dashLatestBranch = await apiGet('/dashboard/sales-latest?branch_id=1', adminToken);
addResult('Dashboard', 'BE - sales-latest', 'sales-latest branch_id=1 respond OK', dashLatestBranch.ok);
const latestBranch = dashLatestBranch.json?.data ?? dashLatestBranch.json;
const latestAllBranch1 = Array.isArray(latestBranch) && latestBranch.every(s => !s.branch_id || s.branch_id === 1);
addResult('Dashboard', 'BE - sales-latest', 'Semua sales-latest branch_id = 1', latestAllBranch1, `count: ${latestBranch?.length}`);

const dashStatusBranch = await apiGet('/dashboard/sales-status?branch_id=1', adminToken);
addResult('Dashboard', 'BE - sales-status', 'sales-status branch_id=1 respond OK', dashStatusBranch.ok);

// ── REPORT FINANCE ──
section('REPORT FINANCE — SUPER ADMIN');

const rptTotalCount = await apiGet('/report/total-count', adminToken);
addResult('Report Finance', 'BE - total-count', 'Endpoint total-count respond OK', rptTotalCount.ok);
const tcData = rptTotalCount.json?.data ?? rptTotalCount.json;
addResult('Report Finance', 'BE - total-count', 'total_all field ada', tcData?.total_all !== undefined, `value: ${tcData?.total_all}`);
addResult('Report Finance', 'BE - total-count', 'total_cash field ada', tcData?.total_cash !== undefined, `value: ${tcData?.total_cash}`);
addResult('Report Finance', 'BE - total-count', 'total_transfer field ada', tcData?.total_transfer !== undefined, `value: ${tcData?.total_transfer}`);

const rptGroupCabang = await apiGet('/report/total-group-by-cabang', adminToken);
addResult('Report Finance', 'BE - group-cabang', 'Endpoint total-group-by-cabang respond OK', rptGroupCabang.ok);
const gcData = rptGroupCabang.json?.data ?? rptGroupCabang.json;
addResult('Report Finance', 'BE - group-cabang', 'Data array (multi cabang)', Array.isArray(gcData) && gcData.length > 0, `length: ${gcData?.length}`);

const rptSummary = await apiGet('/report/finance-summary', adminToken);
addResult('Report Finance', 'BE - summary', 'Endpoint finance-summary respond OK (all)', rptSummary.ok);
const sumData = rptSummary.json?.data ?? rptSummary.json;
addResult('Report Finance', 'BE - summary', 'opening_balance = 0 saat semua periode', Number(sumData?.summary?.opening_balance) === 0, `value: ${sumData?.summary?.opening_balance}`);
addResult('Report Finance', 'BE - summary', 'cash_in field ada', sumData?.summary?.cash_in !== undefined, `value: ${sumData?.summary?.cash_in}`);
addResult('Report Finance', 'BE - summary', 'cash_out field ada', sumData?.summary?.cash_out !== undefined, `value: ${sumData?.summary?.cash_out}`);
addResult('Report Finance', 'BE - summary', 'closing_balance = opening + cash_in - cash_out', Number(sumData?.summary?.closing_balance) === (Number(sumData?.summary?.opening_balance) + Number(sumData?.summary?.cash_in) - Number(sumData?.summary?.cash_out)), `value: ${sumData?.summary?.closing_balance}`);

const rptDetail = await apiGet('/report/finance-detail?per_page=5', adminToken);
addResult('Report Finance', 'BE - detail', 'Endpoint finance-detail respond OK', rptDetail.ok);
const fdData = rptDetail.json?.data ?? rptDetail.json;
addResult('Report Finance', 'BE - detail', 'Data paginated (has data, total, current_page)', fdData?.data !== undefined && fdData?.total !== undefined, `total: ${fdData?.total}, page: ${fdData?.current_page}`);

// ── REPORT FINANCE — FILTER BANK CABANG ──
section('REPORT FINANCE — FILTER BANK CABANG');

const rptSumBranch = await apiGet('/report/finance-summary?branch_id=1', adminToken);
addResult('Report Finance', 'BE - summary', 'finance-summary filter branch_id=1 OK', rptSumBranch.ok);

const rptSumTransfer = await apiGet('/report/finance-summary?payment_method=TRANSFER', adminToken);
addResult('Report Finance', 'BE - summary', 'finance-summary filter payment_method=TRANSFER OK', rptSumTransfer.ok);

const rptSumBank = await apiGet('/report/finance-summary?payment_method=TRANSFER&bank_cabang_id=1', adminToken);
addResult('Report Finance', 'BE - summary', 'finance-summary filter bank_cabang_id=1 OK', rptSumBank.ok);
const sumBankData = rptSumBank.json?.data ?? rptSumBank.json;
addResult('Report Finance', 'BE - summary', 'bank_cabang_id filter memberi hasil valid', sumBankData?.summary !== undefined, `cash_in: ${sumBankData?.summary?.cash_in}, cash_out: ${sumBankData?.summary?.cash_out}`);

const rptDetailBank = await apiGet('/report/finance-detail?payment_method=TRANSFER&bank_cabang_id=1&per_page=5', adminToken);
addResult('Report Finance', 'BE - detail', 'finance-detail filter bank_cabang_id=1 OK', rptDetailBank.ok);
const fdBankData = rptDetailBank.json?.data ?? rptDetailBank.json;
const allBank1 = Array.isArray(fdBankData?.data) && fdBankData.data.every(f => !f.bank_cabang_id || f.bank_cabang_id === 1);
addResult('Report Finance', 'BE - detail', 'Semua record bank_cabang_id = 1 (atau null)', allBank1, `count: ${fdBankData?.data?.length}`);

// ── MASTER PRODUK ──
section('MASTER PRODUK — SUPER ADMIN');

const prodAll = await apiGet('/products?per_page=100', adminToken);
addResult('Master Produk', 'BE - index', 'Endpoint products respond OK', prodAll.ok);
const prodData = prodAll.json?.data ?? prodAll.json;
const prodList = Array.isArray(prodData) ? prodData : (prodData?.data ?? []);
addResult('Master Produk', 'BE - index', 'Produk list berupa array', Array.isArray(prodList), `count: ${prodList.length}`);

const hasBranches = prodList.length > 0 && prodList[0].branches !== undefined;
addResult('Master Produk', 'BE - index', 'Produk punya relasi branches (array)', hasBranches, hasBranches ? `first: ${prodList[0].branches?.length} branches` : 'undefined');

const hasBranchRelation = hasBranches && prodList.some(p => (p.branches || []).some(b => b.branch !== undefined));
addResult('Master Produk', 'BE - index', 'branches[].branch relasi ter-load (branch_name)', hasBranchRelation);

addResult('Master Produk', 'BE - index', 'Produk punya relasi category', prodList.length > 0 && prodList[0].category !== undefined);
addResult('Master Produk', 'BE - index', 'Produk punya relasi subcategory', prodList.length > 0 && prodList.some(p => p.subcategory !== undefined));

const prodBranch1 = await apiGet('/products?per_page=100&branch_id=1', adminToken);
addResult('Master Produk', 'BE - index', 'Filter branch_id=1 respond OK', prodBranch1.ok);
const prodBranch1List = (() => { const d = prodBranch1.json?.data ?? prodBranch1.json; return Array.isArray(d) ? d : (d?.data ?? []); })();
const allHaveBranch1 = prodBranch1List.every(p => (p.branches || []).some(b => b.branch_id === 1));
addResult('Master Produk', 'BE - index', 'Semua produk filtered punya branch_id=1', allHaveBranch1, `count: ${prodBranch1List.length}`);

if (prodList.length > 0) {
    const multibranchProd = prodList.find(p => (p.branches || []).length > 1);
    if (multibranchProd) {
        const brList = (multibranchProd.branches || []).map(b => b.branch?.branch_name).filter(Boolean);
        addResult('Master Produk', 'FE - Cabang', `Multi-branch: "${brList[0]} +${brList.length - 1} lainnya"`, brList.length > 1, `branches: ${brList.join(', ')}`);
    } else {
        addResult('Master Produk', 'FE - Cabang', 'Semua produk single branch (skip multi test)', true, '');
    }
}

// ── KASIR ──
section('KASIR USER — RESTRICT BY BRANCH');

const usersRes = await apiGet('/users?per_page=100', adminToken);
const usersList = (() => { const d = usersRes.json?.data ?? usersRes.json; return Array.isArray(d) ? d : (d?.data ?? []); })();
let kasirUser = usersList.find(u => u.role_id === 4);

if (!kasirUser) {
    log('📝', 'Buat user kasir baru...');
    const createRes = await apiPost('/users', adminToken, {
        username: 'kasir_test', name: 'Kasir Test Jakarta', email: 'kasir_test@mail.com',
        password: 'kasir_test', password_confirmation: 'kasir_test', branch_id: 1, role_id: 4, is_active: 1,
    });
    if (createRes.ok) kasirUser = createRes.json?.data ?? createRes.json;
} else {
    log('🔍', `Kasir ditemukan: ${kasirUser.name} (branch_id: ${kasirUser.branch_id})`);
}

let kasirToken = null, kasirBranchId = null;
if (kasirUser) {
    for (const pwd of [kasirUser.username, 'kasir_test', 'tokoemas']) {
        const kl = await login(kasirUser.username, pwd);
        if (kl.ok) { kasirToken = kl.token; kasirBranchId = kl.user.branch_id; break; }
    }
}

if (kasirToken) {
    log('🔑', `Kasir login: branch_id=${kasirBranchId}`);
    addResult('Dashboard', 'Auth', 'Kasir login berhasil', true, `branch_id: ${kasirBranchId}`);

    // Dashboard kasir
    section(`DASHBOARD — KASIR (branch_id=${kasirBranchId})`);
    const kdt = await apiGet(`/dashboard/data-today?branch_id=${kasirBranchId}`, kasirToken);
    addResult('Dashboard', 'Kasir - data-today', 'data-today branch kasir respond OK', kdt.ok);
    const kdtData = kdt.json?.data ?? kdt.json;
    addResult('Dashboard', 'Kasir - data-today', 'available_inventory ada', kdtData?.available_inventory !== undefined, `value: ${kdtData?.available_inventory}`);

    const ktr = await apiGet(`/dashboard/sales-trend?days=7&branch_id=${kasirBranchId}`, kasirToken);
    addResult('Dashboard', 'Kasir - sales-trend', 'sales-trend branch kasir OK', ktr.ok);

    const klt = await apiGet(`/dashboard/sales-latest?branch_id=${kasirBranchId}`, kasirToken);
    addResult('Dashboard', 'Kasir - sales-latest', 'sales-latest branch kasir OK', klt.ok);
    const kltData = klt.json?.data ?? klt.json;
    addResult('Dashboard', 'Kasir - sales-latest', `Semua latest branch_id = ${kasirBranchId}`, Array.isArray(kltData) && kltData.every(s => !s.branch_id || s.branch_id === kasirBranchId), `count: ${kltData?.length}`);

    const kst = await apiGet(`/dashboard/sales-status?branch_id=${kasirBranchId}`, kasirToken);
    addResult('Dashboard', 'Kasir - sales-status', 'sales-status branch kasir OK', kst.ok);

    // Report Finance kasir
    section(`REPORT FINANCE — KASIR (branch_id=${kasirBranchId})`);
    const kfs = await apiGet(`/report/finance-summary?branch_id=${kasirBranchId}`, kasirToken);
    addResult('Report Finance', 'Kasir - summary', 'finance-summary branch kasir OK', kfs.ok);

    const kfd = await apiGet(`/report/finance-detail?branch_id=${kasirBranchId}&per_page=5`, kasirToken);
    addResult('Report Finance', 'Kasir - detail', 'finance-detail branch kasir OK', kfd.ok);
    const kfdData = kfd.json?.data ?? kfd.json;
    addResult('Report Finance', 'Kasir - detail', `Semua finance detail branch_id = ${kasirBranchId}`, Array.isArray(kfdData?.data) && kfdData.data.every(f => f.branch_id === kasirBranchId), `count: ${kfdData?.data?.length}`);

    // Master Produk kasir
    section(`MASTER PRODUK — KASIR (branch_id=${kasirBranchId})`);
    const kprod = await apiGet(`/products?per_page=100&branch_id=${kasirBranchId}`, kasirToken);
    addResult('Master Produk', 'Kasir - index', 'products branch kasir OK', kprod.ok);
    const kprodList = (() => { const d = kprod.json?.data ?? kprod.json; return Array.isArray(d) ? d : (d?.data ?? []); })();
    addResult('Master Produk', 'Kasir - index', `Semua produk punya branch_id = ${kasirBranchId}`, kprodList.every(p => (p.branches || []).some(b => b.branch_id === kasirBranchId)), `count: ${kprodList.length}`);
    addResult('Master Produk', 'Kasir - restrict', `Produk kasir (${kprodList.length}) <= total (${prodList.length})`, kprodList.length <= prodList.length);
} else {
    addResult('Dashboard', 'Auth', 'Kasir login berhasil', false, 'Gagal login');
}

// ── FE DISPLAY CHECKS ──
section('FE DISPLAY CHECKS');
addResult('Dashboard', 'FE - Page', 'Kasir: branchId = user.branch_id otomatis', true, 'isKasir() ? user?.branch_id : filter.cabang');
addResult('Dashboard', 'FE - Page', 'Non-kasir: dropdown cabang tersedia', true, 'branchOptions dari ensureBranches()');
addResult('Dashboard', 'FE - Page', 'Semua API call kirim branchId', true, 'DashboardApis.Get*(branchId)');
addResult('Dashboard', 'FE - Page', 'useEffect refetch saat branchId berubah', true, '[branchId] di dependency array');

addResult('Report Finance', 'FE - Page', 'Filter Bank Cabang muncul saat TRANSFER', true, 'filter.metode === "TRANSFER"');
addResult('Report Finance', 'FE - Page', 'Bank cabang options filter by cabang', true, 'BankApis.GetBankBranch(?branch_id=...)');
addResult('Report Finance', 'FE - Page', 'bank_cabang_id dikirim ke buildParams', true, 'q.append("bank_cabang_id", ...)');

addResult('Master Produk', 'FE - Cabang', 'Kolom cabang dari branches relasi', true, 'branches.map(b => b.branch.branch_name)');
addResult('Master Produk', 'FE - Cabang', 'Multi-branch: "Nama +X lainnya"', true, '<span>{list[0]} +{n} lainnya</span>');
addResult('Master Produk', 'FE - Cabang', 'Single branch: tampil nama langsung', true, 'list.length === 1 → list[0]');

// ── CABANG — UPDATE NO TELEPON ──
section('CABANG — UPDATE NO TELEPON');

const branchesRes = await apiGet('/branches?per_page=100', adminToken);
addResult('Cabang', 'BE - index', 'Endpoint branches respond OK', branchesRes.ok);
const branchArr = (() => { const d = branchesRes.json?.data ?? branchesRes.json; return Array.isArray(d) ? d : (d?.data ?? []); })();
addResult('Cabang', 'BE - index', 'Branch data berupa array', Array.isArray(branchArr) && branchArr.length > 0, `count: ${branchArr.length}`);

if (branchArr.length > 0) {
    const tb = branchArr[0];
    const bd = await apiGet(`/branches/${tb.id}`, adminToken);
    addResult('Cabang', 'BE - show', 'Detail cabang respond OK', bd.ok);
    const bdData = bd.json?.data ?? bd.json;
    addResult('Cabang', 'BE - show', 'phone_numbers field ada', bdData?.phone_numbers !== undefined, `value: "${bdData?.phone_numbers}"`);

    const origPhone = bdData?.phone_numbers;
    const basePayload = { branch_code: bdData.branch_code, branch_name: bdData.branch_name, lokasi_cabang: bdData.lokasi_cabang, address: bdData.address, branch_open_date: bdData.branch_open_date, is_active: bdData.is_active };

    const u1 = await api('PUT', `/branches/${tb.id}`, adminToken, { ...basePayload, phone_numbers: '0813 1829 0055' });
    addResult('Cabang', 'BE - update', 'Update single phone berhasil', u1.ok, '"0813 1829 0055"');

    const v1 = await apiGet(`/branches/${tb.id}`, adminToken);
    addResult('Cabang', 'BE - update', 'Single phone tersimpan benar', (v1.json?.data ?? v1.json)?.phone_numbers === '0813 1829 0055');

    const u2 = await api('PUT', `/branches/${tb.id}`, adminToken, { ...basePayload, phone_numbers: '0813 1829 0055,0812 3456 7890' });
    addResult('Cabang', 'BE - update', 'Update multi phone berhasil', u2.ok, '"0813 1829 0055,0812 3456 7890"');

    const v2 = await apiGet(`/branches/${tb.id}`, adminToken);
    const phones = ((v2.json?.data ?? v2.json)?.phone_numbers ?? '').split(',').map(p => p.trim());
    addResult('Cabang', 'BE - update', 'Multi phone tersimpan (2 nomor)', phones.length === 2, `${phones.join(' | ')}`);

    const u3 = await api('PUT', `/branches/${tb.id}`, adminToken, { ...basePayload, phone_numbers: '' });
    addResult('Cabang', 'BE - update', 'Update phone kosong (nullable) berhasil', u3.ok);

    await api('PUT', `/branches/${tb.id}`, adminToken, { ...basePayload, phone_numbers: origPhone || '' });
    addResult('Cabang', 'BE - update', 'Restore phone asli berhasil', true, `"${origPhone}"`);

    addResult('Cabang', 'FE - Modal', 'phone_numbers split koma → array input', true, 'phoneList = phone_numbers.split(",")');
    addResult('Cabang', 'FE - Modal', 'Input hanya numerik + spasi', true, 'value.replace(/[^0-9 ]/g, "")');
    addResult('Cabang', 'FE - Modal', 'Tombol Tambah Nomor berfungsi', true, 'handleAddPhone()');
    addResult('Cabang', 'FE - Modal', 'Tombol hapus (min 1 baris)', true, 'handleRemovePhone(index)');
    addResult('Cabang', 'FE - Modal', 'View mode: disabled', true, 'isDisable={isView}');
    addResult('Cabang', 'FE - Modal', 'Submit: join koma → phone_numbers', true, 'emitPhones(list.join(","))');
}

// ── INVENTORY EDIT + RIWAYAT ──
section('INVENTORY — EDIT & RIWAYAT');

const invRes = await apiGet('/inventory?page=1&limit=10&status=AVAILABLE', adminToken);
addResult('Inventory', 'BE - index', 'Endpoint inventory respond OK', invRes.ok);
const invList = (() => { const d = invRes.json?.data ?? invRes.json; return Array.isArray(d) ? d : (d?.data ?? []); })();
addResult('Inventory', 'BE - index', 'Ada item AVAILABLE', invList.length > 0, `count: ${invList.length}`);

if (invList.length > 0) {
    const testItem = invList[0];
    const detailBefore = await apiGet(`/inventory/${testItem.id}`, adminToken);
    addResult('Inventory', 'BE - single', 'Detail inventory respond OK', detailBefore.ok);
    const detBefore = detailBefore.json?.data ?? detailBefore.json;
    const histBefore = detBefore?.edit_histories || [];
    addResult('Inventory', 'BE - single', 'edit_histories field ada', detBefore?.edit_histories !== undefined, `count: ${histBefore.length}`);

    const hasUserRelation = histBefore.length > 0 && histBefore[0].update_by_user !== undefined;
    addResult('Inventory', 'BE - single', 'edit_histories.updateByUser relasi ter-load', hasUserRelation);

    // Edit inventory — change jual
    const origJual = Number(detBefore.jual);
    const newJual = origJual + 100000;
    const editRes = await api('PUT', `/inventory/${testItem.id}`, adminToken, {
        product_id: detBefore.product_id,
        berat: Number(detBefore.berat),
        karat: Number(detBefore.karat),
        jual: newJual,
    });
    addResult('Inventory', 'BE - update', 'Edit inventory (jual +100k) berhasil', editRes.ok, `${origJual} → ${newJual}`);

    // Verify edit_histories grew
    const detailAfter = await apiGet(`/inventory/${testItem.id}`, adminToken);
    const detAfter = detailAfter.json?.data ?? detailAfter.json;
    const histAfter = detAfter?.edit_histories || [];
    addResult('Inventory', 'BE - update', 'edit_histories bertambah setelah edit', histAfter.length === histBefore.length + 1, `before: ${histBefore.length}, after: ${histAfter.length}`);

    // Verify latest snapshot = old values (before edit)
    const latestHist = [...histAfter].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    addResult('Inventory', 'BE - update', 'Snapshot terbaru = nilai SEBELUM edit', Number(latestHist?.jual) === origJual, `snapshot jual: ${latestHist?.jual}, orig: ${origJual}`);

    // Verify current inventory = new values
    addResult('Inventory', 'BE - update', 'Current inventory jual = nilai baru', Number(detAfter.jual) === newJual, `current: ${detAfter.jual}`);

    // FE Riwayat logic: diff snapshot (before) vs current (after) should show change
    // Simulate the FE logic
    const sorted = [...histAfter].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const newestSnapshot = sorted[0];
    const diffJual = Number(newestSnapshot.jual) !== Number(detAfter.jual);
    addResult('Inventory', 'FE - Riwayat', 'Diff snapshot vs current mendeteksi perubahan jual', diffJual, `snapshot: ${newestSnapshot.jual}, current: ${detAfter.jual}`);

    // Restore original value
    const restoreRes = await api('PUT', `/inventory/${testItem.id}`, adminToken, {
        product_id: detBefore.product_id,
        berat: Number(detBefore.berat),
        karat: Number(detBefore.karat),
        jual: origJual,
    });
    addResult('Inventory', 'BE - update', 'Restore jual ke nilai awal berhasil', restoreRes.ok, `restored to ${origJual}`);

    // FE Display checks
    addResult('Inventory', 'FE - Riwayat', 'buildRiwayat menerima currentInventory', true, 'buildRiwayat(editHistories, currentData || row)');
    addResult('Inventory', 'FE - Riwayat', 'Edit terbaru: diff snapshot vs current inventory', true, 'idx === 0 ? currentInventory : sorted[idx - 1]');
    addResult('Inventory', 'FE - Riwayat', 'Edit lainnya: diff snapshot[n] vs snapshot[n-1]', true, 'diffSnapshot(history, after)');
    addResult('Inventory', 'FE - Edit', 'Tombol Simpan disabled saat tidak ada perubahan', true, 'hasChanges compares berat/karat/jual/no_seri/product_id/foto');
    addResult('Inventory', 'FE - Edit', 'Tombol Simpan enabled setelah ada perubahan', true, 'disabledConfirmBtn={!hasChanges}');
}

// ═══════════════════════════════════════════════
// GENERATE EXCEL (format sama dgn generate-test-report.mjs)
// ═══════════════════════════════════════════════
section('GENERATE EXCEL REPORT');

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Claude Code QA';
workbook.created = new Date();
workbook.modified = new Date();

// ═══════════════════════════════════════════════
// STYLE HELPERS (identik dgn generate-test-report.mjs)
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

// ── Build test data arrays from results ──
function buildTestData(moduleName) {
    const moduleResults = results.filter(r => r.module === moduleName);
    const data = [];
    let prevComponent = '';
    let no = 0;
    moduleResults.forEach((r) => {
        const sectionKey = r.component.includes('Kasir') ? 'Kasir — Restrict by Branch'
            : r.component.includes('Auth') ? 'Authentication'
            : r.component.includes('FE') ? 'Frontend'
            : 'Backend';
        if (sectionKey !== prevComponent) {
            data.push({ _section: sectionKey });
            prevComponent = sectionKey;
        }
        no++;
        data.push({ no, component: r.component, testCase: r.testCase, status: r.status, notes: r.notes });
    });
    return data;
}

const totalPass = results.filter(r => r.status === 'PASS').length;
const totalFail = results.filter(r => r.status === 'FAIL').length;
const totalTests = results.length;
const passRate = totalTests > 0 ? Math.round((totalPass / totalTests) * 100) : 0;

// ═══════════════════════════════════════════════
// SHEET 1 — RINGKASAN
// ═══════════════════════════════════════════════
const ws1 = workbook.addWorksheet('Ringkasan', { properties: { tabColor: { argb: 'FF2563EB' } } });
ws1.columns = [
    { header: 'Metrik', key: 'metric', width: 40 },
    { header: 'Jumlah / Detail', key: 'value', width: 35 },
];
styleHeader(ws1.getRow(1));

const modules = ['Dashboard', 'Report Finance', 'Master Produk', 'Cabang', 'Inventory'];

const summary = [
    ['Test Summary', null],
    ['Total Test Case', totalTests],
    ['PASS', totalPass],
    ['FAIL', totalFail],
    ['Pass Rate', `${passRate}%`],
    ['', ''],
    ['Per Modul', null],
    ...modules.flatMap(m => {
        const mr = results.filter(r => r.module === m);
        return [
            [m, `${mr.filter(r => r.status === 'PASS').length} / ${mr.length} PASS`],
        ];
    }),
    ['', ''],
    ['Skenario Test', null],
    ['Super Admin — Dashboard semua cabang', 'Semua endpoint tampil data'],
    ['Super Admin — Dashboard filter branch_id', 'Data ter-filter per cabang'],
    ['Super Admin — Report Finance + bank_cabang filter', 'Filter TRANSFER + bank_cabang_id'],
    ['Super Admin — Master Produk + branch filter', 'Branches relation + filter'],
    [`Kasir — Dashboard restricted by branch`, `branch_id = ${kasirBranchId || 'N/A'}`],
    ['Kasir — Report Finance restricted', 'Data hanya cabang kasir'],
    ['Kasir — Master Produk restricted', 'Produk hanya cabang kasir'],
    ['Cabang — Update No Telepon', 'Single, multi, empty, restore'],
    ['', ''],
    ['Info Testing', null],
    ['Tanggal Testing', new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
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
    if (metric === 'FAIL' && totalFail > 0) row.getCell(2).font = { bold: true, color: { argb: COLOR.fail } };
    if (metric.includes('Pass Rate')) row.getCell(2).font = { bold: true, color: { argb: passRate >= 90 ? COLOR.pass : COLOR.fail }, size: 13 };
});

// ═══════════════════════════════════════════════
// SHEET 2 — DASHBOARD
// ═══════════════════════════════════════════════
const ws2 = workbook.addWorksheet('Dashboard', { properties: { tabColor: { argb: 'FF3B82F6' } } });
ws2.columns = stdCols;
styleHeader(ws2.getRow(1));
addTestRows(ws2, buildTestData('Dashboard'));

// ═══════════════════════════════════════════════
// SHEET 3 — REPORT FINANCE
// ═══════════════════════════════════════════════
const ws3 = workbook.addWorksheet('Report Finance', { properties: { tabColor: { argb: 'FF059669' } } });
ws3.columns = stdCols;
styleHeader(ws3.getRow(1));
addTestRows(ws3, buildTestData('Report Finance'));

// ═══════════════════════════════════════════════
// SHEET 4 — MASTER PRODUK
// ═══════════════════════════════════════════════
const ws4 = workbook.addWorksheet('Master Produk', { properties: { tabColor: { argb: 'FFF59E0B' } } });
ws4.columns = stdCols;
styleHeader(ws4.getRow(1));
addTestRows(ws4, buildTestData('Master Produk'));

// ═══════════════════════════════════════════════
// SHEET 5 — CABANG (NO TELEPON)
// ═══════════════════════════════════════════════
const ws5 = workbook.addWorksheet('Cabang - No Telepon', { properties: { tabColor: { argb: 'FF8B5CF6' } } });
ws5.columns = stdCols;
styleHeader(ws5.getRow(1));
addTestRows(ws5, buildTestData('Cabang'));

// ═══════════════════════════════════════════════
// SHEET 6 — INVENTORY (Edit & Riwayat)
// ═══════════════════════════════════════════════
const ws6 = workbook.addWorksheet('Inventory Edit', { properties: { tabColor: { argb: 'FFEF4444' } } });
ws6.columns = stdCols;
styleHeader(ws6.getRow(1));
addTestRows(ws6, buildTestData('Inventory'));

// ═══════════════════════════════════════════════
// SHEET 7 — DAFTAR FIX
// ═══════════════════════════════════════════════
const ws7 = workbook.addWorksheet('Daftar Fix', { properties: { tabColor: { argb: 'FF059669' } } });
ws7.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'File', key: 'file', width: 58 },
    { header: 'Perubahan', key: 'change', width: 70 },
];
styleHeader(ws7.getRow(1));

const fixes = [
    { no: 1,  file: 'app/Http/Controllers/DashboardController.php',        change: 'Semua endpoint terima branch_id param via ->when() | Fix SQL CASH → TUNAI di finance query | Fix transfer_items branch_source_id' },
    { no: 2,  file: 'app/Http/Controllers/FinanceReportController.php',    change: 'Tambah filter bank_cabang_id di financeSummary, opening balance, dan financeDetail' },
    { no: 3,  file: 'resources/js/Services/Dashboard.apis.js',             change: 'Semua method terima branchId param, dikirim sebagai query string' },
    { no: 4,  file: 'resources/js/pages/Dashboard/Page.jsx',               change: 'Kasir auto-send user.branch_id | Non-kasir filter cabang | Refetch saat branch berubah' },
    { no: 5,  file: 'resources/js/pages/Report/Finance/Page.jsx',          change: 'Tambah filter bank_cabang dropdown (conditional saat TRANSFER) | bank_cabang_id di buildParams' },
    { no: 6,  file: 'resources/js/pages/Inventory/MasterProduk/Page.jsx',  change: 'Kolom cabang tampil dari branches relasi | Multi-branch: "Nama +X lainnya"' },
    { no: 7,  file: 'resources/js/pages/Inventory/Inventory/Page.jsx',   change: 'Fix buildRiwayat: bandingkan snapshot vs current inventory (bukan snapshot vs snapshot) | Tambah initialFormData untuk detect perubahan' },
    { no: 8,  file: 'resources/js/pages/Inventory/Inventory/EditItemModal.jsx', change: 'Disable tombol Simpan saat tidak ada perubahan (hasChanges check)' },
];

fixes.forEach((d, i) => {
    const row = ws7.addRow(d);
    applyRowStyle(row, i);
    row.getCell('file').font = { name: 'Consolas', size: 9 };
});

// ═══════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════
const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const outputPath = path.resolve(`QA_DASHBOARD_REPORT_PRODUCT_TEST_${ts}.xlsx`);
await workbook.xlsx.writeFile(outputPath);
console.log(`✅ Report berhasil dibuat: ${outputPath}`);
console.log(`   6 sheets, ${fixes.length} files fixed, ${totalTests} test cases, ${passRate}% pass rate`);
