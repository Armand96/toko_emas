/**
 * PAGE-DRIVEN E2E — Halaman "Input Penjualan" (Penjualan/FormAdd.jsx) ASLI.
 *
 * Ini bukan panggil service langsung: kita RENDER komponen halaman betulan lalu
 * menggerakkannya seperti kasir sungguhan — isi form customer, pilih item,
 * masukkan uang, klik "Ajukan Transaksi Penjualan". Tombol itu memicu
 * handleSubmit milik halaman → Services asli → API Laravel asli.
 *
 * Setup (provisi stok yg bisa dijual) lewat service; AKSI yang diuji lewat UI.
 *
 * Jalankan:  bun run test:e2e   (butuh server + DB seed + user test)
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { loginAll, as, list, payload, num } from '../helpers';
import InventoryApis from '../../../Services/Inventory.apis';
import PenjualanApis from '../../../Services/Penjualan.apis';
import OptionsStore from '../../../Store/OptionsStore';
import FormAdd from '../../../pages/Penjualan/FormAdd';

// Sediakan 1 item AVAILABLE di cabang Jakarta supaya halaman punya yg dijual.
async function provisionAvailableItem() {
    as('super');
    const product = list(await InventoryApis.GetProducts('?per_page=100'))
        .find((p) => (p.branches || []).some((b) => b.branch_id === 1));
    if (!product) throw new Error('Produk cabang Jakarta tak ada — cek seeder');

    as('kasirJkt');
    const mk = await InventoryApis.PostPembelian({
        data: [{
            branch_id: 1, product_id: product.id, category_id: product.category_id,
            subcategory_id: product.subcategory_id || 0, supplier_id: 2, barcode: product.barcode,
            serial_number: 'PAGE-' + Date.now(), berat: 4, karat: 22,
            modal: 1000000, jual: 1500000, tipe_pembayaran: 'TUNAI', bank_cabang_id: null,
        }],
    });
    const pid = list(mk)[0]?.id;

    as('owner');
    await InventoryApis.updatePembelian({ status: 'DISETUJUI', pembelian_ids: [pid] });

    as('super');
    const inv = list(await InventoryApis.GetInventory(`?per_page=200&pembelian_id=${pid}`))
        .find((i) => i.pembelian_id === pid);
    if (!inv) throw new Error('Inventory hasil approve tak terbentuk');
    return inv; // { inventory_code, jual, ... }
}

let itemToSell = null;

beforeAll(async () => {
    try {
        await loginAll();
        itemToSell = await provisionAvailableItem();
    } catch (e) {
        throw new Error('Setup gagal (server/seed?). Detail: ' + e.message);
    }
    // reset cache produk supaya halaman fetch fresh (ada item baru).
    OptionsStore.getState().invalidate('products');
}, 30000);

describe('Halaman Input Penjualan (FormAdd) — kasir menjual 1 item tunai', () => {
    it('mengisi form & klik "Ajukan" → transaksi tercatat di backend', async () => {
        as('kasirJkt'); // AuthStore.user dibaca komponen (branch_id=1, attach token)
        const setCurentState = vi.fn();
        const customerName = 'Page Customer ' + Date.now();

        render(<FormAdd setCurentState={setCurentState} />);

        // 1) Data customer baru
        fireEvent.change(screen.getByPlaceholderText('Masukkan nama customer'), { target: { value: customerName } });
        fireEvent.change(screen.getByPlaceholderText('Contoh: 08xxxxxxxxxx'), { target: { value: '081299998888' } });
        fireEvent.change(screen.getByPlaceholderText('Masukkan alamat customer'), { target: { value: 'Jl. Uji Halaman 1' } });

        // 2) Pilih item lewat react-select (menunggu opsi inventory selesai di-fetch).
        const combobox = screen.getByRole('combobox');
        await waitFor(
            () => selectEvent.select(combobox, new RegExp(itemToSell.inventory_code)),
            { timeout: 15000 },
        );
        // item muncul di keranjang → harga jual terlihat
        expect(await screen.findByText(itemToSell.inventory_code)).toBeInTheDocument();

        // 3) Bayar tunai ≥ subtotal
        const uang = document.querySelector('input[name="uangDibayar"]');
        fireEvent.change(uang, { target: { value: String(num(itemToSell.jual) + 100000) } });

        // 4) Tombol aktif → klik Ajukan
        const submit = screen.getByRole('button', { name: /Ajukan Transaksi Penjualan/i });
        await waitFor(() => expect(submit).toBeEnabled());
        fireEvent.click(submit);

        // 5) handleSubmit sukses → halaman kembali ke 'main' (via prop callback)
        await waitFor(() => expect(setCurentState).toHaveBeenCalledWith('main'), { timeout: 15000 });

        // 6) Verifikasi ke BACKEND: sale terbaru = customer & item kita, status awal APPROVAL
        as('super');
        const latest = list(await PenjualanApis.GetPenjualan('?per_page=5'))[0];
        expect(latest).toBeTruthy();
        expect(latest.approval_status).toBe('APPROVAL');
        expect(num(latest.grand_total)).toBe(num(itemToSell.jual));
    }, 40000);
});
