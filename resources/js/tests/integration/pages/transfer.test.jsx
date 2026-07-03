/**
 * PAGE-DRIVEN E2E — Transfer Item (input + approval).
 *
 * 1) Kasir (cabang Jakarta) isi form transfer → cabang tujuan Bogor, catatan,
 *    pilih item → "Ajukan Transfer Item" → inventory jadi TRANSIT.
 * 2) Owner buka Approval Transfer → Setujui → inventory pindah ke Bogor & AVAILABLE.
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { selectByLabel, setField, selectItemDropdown, clickAlertButton } from './_ui';
import { makeInventory, ensureSecondBranch } from '../provision';
import InventoryApis from '../../../Services/Inventory.apis';
import OptionsStore from '../../../Store/OptionsStore';
import TransferForm from '../../../pages/Inventory/transfer/FormAdd';
import ApprovalTransfer from '../../../pages/Approval/ApprovalTransfer/Page';

let inv = null;
let dest = null;

beforeAll(async () => {
    await loginAll();
    dest = await ensureSecondBranch(); // cabang tujuan (buat kalau belum ada)
    const prov = await makeInventory({ branch: 1, modal: 800000, jual: 1100000 });
    inv = prov.inventory;
    OptionsStore.getState().invalidate('branches'); // agar form memuat cabang terbaru
}, 40000);

describe('Input Transfer (kasir) → TRANSIT', () => {
    it('isi cabang tujuan + catatan + item → Ajukan → inventory TRANSIT', async () => {
        as('kasirJkt');
        render(<TransferForm setCurentState={vi.fn()} />);

        await selectByLabel(/Cabang Tujuan/, dest.branch_name);
        setField('catatan', 'Transfer e2e via halaman');
        await selectItemDropdown(inv.inventory_code);

        fireEvent.click(screen.getByRole('button', { name: /Ajukan Transfer Item/i }));

        await waitFor(async () => {
            as('super');
            const d = (await InventoryApis.GetInventorySingle(inv.id))?.data;
            expect(d.status).toBe('TRANSIT');
        }, { timeout: 15000 });
    }, 45000);
});

describe('Approval Transfer (owner) → pindah cabang & AVAILABLE', () => {
    it('buka detail transfer → Setujui → inventory AVAILABLE di Bogor', async () => {
        as('super');
        const transfer = list(await InventoryApis.GetTransferItem('?per_page=5&status=APPROVAL'))[0];
        expect(transfer).toBeTruthy();

        as('owner');
        window.history.pushState({}, '', '/approval/transfer');
        render(<ApprovalTransfer />);

        const cell = await screen.findByText(transfer.kode_transfer, {}, { timeout: 15000 });
        fireEvent.click(within(cell.closest('tr')).getByTitle('Lihat Detail'));

        fireEvent.click(await screen.findByRole('button', { name: /^Setujui$/ }));
        await clickAlertButton(/Setujui Transfer Item/, /^Setujui$/);

        await waitFor(async () => {
            as('super');
            const d = (await InventoryApis.GetInventorySingle(inv.id))?.data;
            expect(d.status).toBe('AVAILABLE');
            expect(d.branch_id).toBe(dest.id);
        }, { timeout: 15000 });
    }, 45000);
});
