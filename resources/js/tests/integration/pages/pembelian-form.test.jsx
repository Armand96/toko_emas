/**
 * PAGE-DRIVEN E2E — Halaman "Input Pembelian" (Inventory/Pembelian/FormAdd.jsx).
 *
 * Kasir mengisi 1 item (produk, berat, karat, modal, jual, supplier, tunai),
 * klik "Tambah ke Batch", lalu "Simpan & Ajukan Pembelian". Tombol memicu
 * handleSubmitBatch milik halaman → InventoryApis.PostPembelian → API asli.
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { loginAll, as, list, num } from '../helpers';
import { selectByLabel, setField } from './_ui';
import InventoryApis from '../../../Services/Inventory.apis';
import SupplierApis from '../../../Services/Supplier.apis';
import OptionsStore from '../../../Store/OptionsStore';
import FormPembelian from '../../../pages/Inventory/Pembelian/FormAdd';

let product = null;
let supplierName = null;

beforeAll(async () => {
    await loginAll();
    as('super');
    product = list(await InventoryApis.GetProducts('?per_page=100'))
        .find((p) => (p.branches || []).some((b) => b.branch_id === 1));
    if (!product) throw new Error('Produk cabang Jakarta tak ada');
    supplierName = list(await SupplierApis.GetSupplier('?is_active=1&per_page=20'))[0]?.supplier_name;
    if (!supplierName) throw new Error('Supplier aktif tak ada');
    // pastikan halaman fetch data master fresh
    OptionsStore.getState().invalidate('products');
    OptionsStore.getState().invalidate('suppliers');
}, 30000);

describe('Halaman Input Pembelian (FormPembelian) — kasir input 1 item tunai', () => {
    it('isi form → tambah ke batch → simpan → pembelian APPROVAL tercatat', async () => {
        as('kasirJkt'); // branch_id=1 auto-lock (isKasir)
        const setCurentState = vi.fn();

        render(<FormPembelian setCurentState={setCurentState} />);

        // Produk (react-select) — menunggu opsi produk cabang selesai dimuat
        await selectByLabel(/Produk \(master\)/, product.product_name);

        // detail item
        setField('berat', '4');
        setField('karat', '22');
        setField('modal', '1000000');
        setField('jual', '1400000');

        await selectByLabel(/^Supplier/, supplierName);
        await selectByLabel(/Metode Pembayaran/, 'Tunai'); // hindari wajib Bank Keluar

        // Tambah ke batch → tabel batch berisi 1 item
        screen.getByRole('button', { name: /Tambah ke Batch/i }).click();
        expect(await screen.findByText(/Batch Pembelian \(1 item\)/)).toBeInTheDocument();

        // Simpan & Ajukan → PostPembelian
        const simpan = screen.getByRole('button', { name: /Simpan.*Ajukan Pembelian/i });
        await waitFor(() => expect(simpan).toBeEnabled());
        simpan.click();

        // sukses → halaman kembali ke 'main'
        await waitFor(() => expect(setCurentState).toHaveBeenCalledWith('main'), { timeout: 15000 });

        // verifikasi backend: pembelian terbaru = produk kita, status APPROVAL, tunai
        as('super');
        const latest = list(await InventoryApis.GetPembelian('?per_page=5'))
            .find((p) => p.product_id === product.id);
        expect(latest).toBeTruthy();
        expect(latest.status).toBe('APPROVAL');
        expect(num(latest.modal)).toBe(1000000);
    }, 45000);
});
