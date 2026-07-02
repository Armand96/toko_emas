/**
 * PAGE-DRIVEN E2E — Remove Item (input HILANG + approval).
 *
 * 1) Kasir isi form remove (jenis HILANG default) + catatan + item →
 *    "Simpan & Ajukan" → remove item status APPROVAL, inventory masih AVAILABLE.
 * 2) Owner buka Approval Remove Item → Setujui → inventory jadi LOST.
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { setField, selectItemDropdown, clickAlertButton } from './_ui';
import { makeInventory } from '../provision';
import InventoryApis from '../../../Services/Inventory.apis';
import RemoveForm from '../../../pages/Inventory/Remove/FormAdd';
import ApprovalRemoveItem from '../../../pages/Approval/ApprovalRemoveItem/Page';

let inv = null;
let removeRow = null;

beforeAll(async () => {
    await loginAll();
    const prov = await makeInventory({ branch: 1, modal: 700000, jual: 950000 });
    inv = prov.inventory;
}, 40000);

describe('Input Remove Item (kasir, HILANG)', () => {
    it('isi catatan + pilih item → Simpan & Ajukan → remove item APPROVAL tercatat', async () => {
        as('kasirJkt');
        render(<RemoveForm setCurentState={vi.fn()} />);

        setField('catatan', 'Hilang saat cek rutin (e2e)');
        await selectItemDropdown(inv.inventory_code);

        fireEvent.click(screen.getByRole('button', { name: /Simpan & Ajukan/i }));

        await waitFor(async () => {
            as('super');
            removeRow = list(await InventoryApis.GetRemoveItem('?per_page=5&status=APPROVAL'))
                .find((r) => (r.details || []).some((d) => d.inventory_code === inv.inventory_code));
            expect(removeRow).toBeTruthy();
        }, { timeout: 15000 });
        expect(removeRow.jenis).toBe('HILANG');
    }, 45000);
});

describe('Approval Remove Item (owner) → inventory LOST', () => {
    it('buka detail remove → Setujui → inventory jadi LOST', async () => {
        as('owner');
        window.history.pushState({}, '', '/approval/remove-item');
        render(<ApprovalRemoveItem />);

        const cell = await screen.findByText(removeRow.code, {}, { timeout: 15000 });
        fireEvent.click(within(cell.closest('tr')).getByTitle('Lihat Detail'));

        fireEvent.click(await screen.findByRole('button', { name: /^Setujui$/ }));
        await clickAlertButton(/Setujui Remove Item/, /^Setujui$/);

        await waitFor(async () => {
            as('super');
            const d = (await InventoryApis.GetInventorySingle(inv.id))?.data;
            expect(d.status).toBe('LOST');
        }, { timeout: 15000 });
    }, 45000);
});
