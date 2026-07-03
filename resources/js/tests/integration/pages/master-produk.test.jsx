/**
 * PAGE-DRIVEN E2E — Master Produk EDIT ITEM (Inventory/MasterProduk) via UI.
 * Cari produk → klik Ubah → ganti nama → "Simpan Perubahan" → PutProducts.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { setField } from './_ui';
import InventoryApis from '../../../Services/Inventory.apis';
import MasterProduk from '../../../pages/Inventory/MasterProduk/Page';

let product = null;

beforeAll(async () => {
    await loginAll();
    as('super');
    product = list(await InventoryApis.GetProducts('?per_page=50'))
        .find((p) => (p.branches || []).some((b) => b.branch_id === 1));
    if (!product) throw new Error('Produk tak ada');
}, 30000);

describe('Master Produk — edit item via UI', () => {
    it('cari produk → Ubah → ganti nama → Simpan Perubahan → ter-update', async () => {
        const renamed = product.product_name + ' E' + String(Date.now()).slice(-4);
        as('super');
        window.history.pushState({}, '', '/inventory/master-produk');
        render(<MasterProduk />);

        // cari produk agar barisnya tampil, lalu klik Ubah
        fireEvent.change(screen.getByPlaceholderText(/Cari produk/i), { target: { value: product.product_name } });
        const cell = await screen.findByText(product.product_name, {}, { timeout: 15000 });
        fireEvent.click(within(cell.closest('tr')).getByTitle('Ubah'));

        // modal memuat detail async (GetProductSingle mengisi branch). Tunggu chip
        // cabang muncul — kalau belum, field "branch" masih kosong & submit diblok
        // oleh validasi "Cabang wajib diisi".
        await waitFor(() => expect(document.querySelector('.react-select__multi-value')).toBeTruthy(), { timeout: 15000 });
        setField('product_name', renamed);

        fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/i }));

        await waitFor(async () => {
            as('super');
            const d = await InventoryApis.GetProductSingle(product.id);
            expect(d.product_name).toBe(renamed);
        }, { timeout: 15000 });
    }, 45000);
});
