/**
 * PAGE-DRIVEN E2E — Approval Penjualan + Cetak Kwitansi.
 *
 * 1) Owner buka detail penjualan pending di halaman Approval Penjualan →
 *    Setujui → konfirmasi → status DISETUJUI (inventory belum SOLD).
 * 2) Kasir buka halaman Penjualan (Main) → klik "Cetak Kwitansi" pada sale itu →
 *    status SELESAI & inventory jadi SOLD.
 *
 * Baris ditemukan dgn mengetik order_id di kotak cari (deterministik).
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { loginAll, as, num } from '../helpers';
import { clickAlertButton } from './_ui';
import { makeInventory, makeSale } from '../provision';
import PenjualanApis from '../../../Services/Penjualan.apis';
import InventoryApis from '../../../Services/Inventory.apis';
import ApprovalPenjualan from '../../../pages/Approval/ApprovalPenjualan/Page';
import PenjualanMain from '../../../pages/Penjualan/Main';

let sale = null;
let inventory = null;

beforeAll(async () => {
    await loginAll();
    const prov = await makeInventory({ modal: 900000, jual: 1200000 });
    inventory = prov.inventory;
    sale = await makeSale({ inventory }); // status APPROVAL
}, 40000);

async function findRowByOrderId(orderId) {
    fireEvent.change(screen.getByPlaceholderText(/Cari kode/i), { target: { value: orderId } });
    const cell = await screen.findByText(orderId, {}, { timeout: 15000 });
    return cell.closest('tr');
}

describe('Approval Penjualan → DISETUJUI (owner)', () => {
    it('buka detail → Setujui → konfirmasi → status DISETUJUI, inventory belum SOLD', async () => {
        as('owner');
        window.history.pushState({}, '', '/approval/penjualan');
        render(<ApprovalPenjualan />);

        const row = await findRowByOrderId(sale.order_id);
        fireEvent.click(within(row).getByTitle('Lihat Detail'));

        fireEvent.click(await screen.findByRole('button', { name: /^Setujui$/ }));
        await clickAlertButton(/Setujui Penjualan/, /^Setujui$/);

        await waitFor(async () => {
            as('super');
            const d = await PenjualanApis.GetPenjualanDetail(sale.id);
            expect((d?.data || d).approval_status).toBe('DISETUJUI');
        }, { timeout: 15000 });

        as('super');
        const inv = (await InventoryApis.GetInventorySingle(inventory.id))?.data;
        expect(inv.status).not.toBe('SOLD'); // belum cetak kwitansi → belum terjual
    }, 45000);
});

describe('Cetak Kwitansi → SELESAI + inventory SOLD (kasir)', () => {
    it('klik "Cetak Kwitansi" pada sale DISETUJUI → SELESAI & inventory SOLD', async () => {
        as('kasirJkt');
        window.history.pushState({}, '', '/transaksi/penjualan');
        render(<PenjualanMain setCurentState={vi.fn()} />);

        const row = await findRowByOrderId(sale.order_id);
        fireEvent.click(within(row).getByTitle('Cetak Kwitansi'));

        await waitFor(async () => {
            as('super');
            const inv = (await InventoryApis.GetInventorySingle(inventory.id))?.data;
            expect(inv.status).toBe('SOLD');
        }, { timeout: 15000 });

        as('super');
        const d = await PenjualanApis.GetPenjualanDetail(sale.id);
        expect(['SELESAI', 'CETAK KWITANSI']).toContain((d?.data || d).approval_status);
    }, 45000);
});
