/**
 * PAGE-DRIVEN E2E — Stock Opname (Inventory/StockOpname/FormAdd.jsx).
 *
 * Kasir memverifikasi 1 kode inventory (input manual → "Verifikasi Barang"),
 * lalu "Finalisasi Opname" → konfirmasi. Memicu handleFinalize halaman →
 * InventoryApis.PostStockOpname → API. Sesi opname tercatat (kode OPN-).
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { loginAll, as, list, num } from '../helpers';
import { clickAlertButton } from './_ui';
import { makeInventory } from '../provision';
import InventoryApis from '../../../Services/Inventory.apis';
import OpnameForm from '../../../pages/Inventory/StockOpname/FormAdd';

let inv = null;

beforeAll(async () => {
    await loginAll();
    const prov = await makeInventory({ branch: 1, modal: 600000, jual: 800000 });
    inv = prov.inventory;
}, 40000);

describe('Stock Opname (kasir) — verifikasi item lalu finalisasi', () => {
    it('input kode → Verifikasi → Finalisasi → sesi opname tercatat (OPN-)', async () => {
        as('kasirJkt');
        render(<OpnameForm setCurentState={vi.fn()} />);

        // tunggu inventory cabang selesai dimuat (subtitle "N item aktif"),
        // supaya kode dikenali sbg item cabang (bukan jalur "Item Extra").
        const input = await screen.findByPlaceholderText(/Masukkan kode/i);
        await waitFor(() => expect(screen.getByText(/\d+ item aktif/)).toBeInTheDocument(), { timeout: 15000 });
        fireEvent.change(input, { target: { value: inv.inventory_code } });
        fireEvent.click(screen.getByRole('button', { name: /Verifikasi Barang/i }));

        // item masuk daftar "Sesuai" (tampil di tabel hasil)
        expect(await screen.findAllByText(inv.inventory_code)).not.toHaveLength(0);

        // finalisasi + konfirmasi
        fireEvent.click(screen.getByRole('button', { name: /Finalisasi Opname/i }));
        await clickAlertButton(/Finalisasi Opname/, /Ya, Finalisasi/);

        // verifikasi backend: sesi opname baru utk cabang 1
        await waitFor(async () => {
            as('super');
            const opn = list(await InventoryApis.GetStockOpname('?per_page=5&branch_id=1'))[0];
            expect(opn?.kode_sesi).toMatch(/OPN-/);
            expect(num(opn?.in_stock)).toBeGreaterThanOrEqual(1);
        }, { timeout: 15000 });
    }, 45000);
});
