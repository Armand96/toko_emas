/**
 * Provisi data (SETUP) lewat service — dipakai untuk menyiapkan kondisi awal
 * sebelum menguji halaman. Yang DIUJI tetap aksi di UI; ini cuma menyiapkan
 * "dunia" (pembelian pending, inventory AVAILABLE, sale pending, dst).
 */
import { as, list, num } from './helpers';
import InventoryApis from '../../Services/Inventory.apis';
import PenjualanApis from '../../Services/Penjualan.apis';
import BranchApis from '../../Services/Branch.apis';

const rnd = () => Math.random().toString(36).slice(2, 7);

/** Produk pertama yg terdaftar di cabang tertentu. */
export async function branchProduct(branch = 1) {
    as('super');
    const p = list(await InventoryApis.GetProducts('?per_page=100'))
        .find((x) => (x.branches || []).some((b) => b.branch_id === branch));
    if (!p) throw new Error('Produk cabang ' + branch + ' tak ada');
    return p;
}

/** Buat 1 pembelian (status APPROVAL). Return { id, product, modal, jual, branch }. */
export async function makePembelian({
    branch = 1, product, tipe = 'TUNAI', bankCabang = null,
    modal = 1000000, jual = 1400000, kasir = 'kasirJkt',
} = {}) {
    const p = product || (await branchProduct(branch));
    as(kasir);
    const res = await InventoryApis.PostPembelian({
        data: [{
            branch_id: branch, product_id: p.id, category_id: p.category_id, subcategory_id: p.subcategory_id || 0,
            supplier_id: 2, barcode: p.barcode, serial_number: 'PV-' + Date.now() + rnd(),
            berat: 4, karat: 22, modal, jual, tipe_pembayaran: tipe, bank_cabang_id: bankCabang,
        }],
    });
    const created = list(res)[0];
    if (!created?.id) throw new Error('Provisi pembelian gagal');
    return { id: created.id, product: p, modal, jual, branch };
}

export async function approvePembelian(id) {
    as('owner');
    await InventoryApis.updatePembelian({ status: 'DISETUJUI', pembelian_ids: [id] });
}

/** Buat pembelian + approve → 1 inventory AVAILABLE. Return { inventory, ... }. */
export async function makeInventory(opts = {}) {
    const pb = await makePembelian(opts);
    await approvePembelian(pb.id);
    as('super');
    const inventory = list(await InventoryApis.GetInventory(`?per_page=200&pembelian_id=${pb.id}`))
        .find((i) => i.pembelian_id === pb.id);
    if (!inventory) throw new Error('Inventory hasil approve tak terbentuk');
    return { ...pb, inventory };
}

/** Pastikan ada cabang kedua (selain Jakarta) untuk uji transfer. Return cabang itu. */
export async function ensureSecondBranch() {
    as('super');
    let branches = list(await BranchApis.GetBranch('?per_page=50'));
    let dest = branches.find((b) => b.id !== 1 && b.is_active);
    if (!dest) {
        await BranchApis.PostBranch({
            branch_name: 'Bogor', branch_code: 'BGR', lokasi_cabang: 'Bogor',
            address: 'Jl. Bogor Raya', phone_numbers: '0251000000', pic: 1,
            branch_open_date: '2020-01-01', is_active: 1,
        });
        branches = list(await BranchApis.GetBranch('?per_page=50'));
        dest = branches.find((b) => b.branch_name === 'Bogor') || branches.find((b) => b.id !== 1);
    }
    if (!dest) throw new Error('Gagal menyiapkan cabang kedua');
    return dest;
}

/** Buat penjualan (status APPROVAL) atas 1 inventory. Return sale terbaru. */
export async function makeSale({ inventory, customerId = 2, kasir = 'kasirJkt' }) {
    as(kasir);
    const price = num(inventory.jual);
    await PenjualanApis.PostPenjualan({
        customer_id: customerId, branch_id: inventory.branch_id, payment_type: 'TUNAI',
        nominal_paid: price + 100000, exchange: 100000,
        item: [{ inventory_code: inventory.inventory_code, product_id: inventory.product_id, price }],
    });
    as('super');
    return list(await PenjualanApis.GetPenjualan('?per_page=5'))[0];
}
