/**
 * PAGE-DRIVEN E2E — Halaman "Approval Pembelian" (Approval/ApprovalPembelian).
 *
 * Owner membuka baris pembelian pending → klik "Setujui" di modal → konfirmasi
 * di dialog. Memicu updateStatus halaman → InventoryApis.updatePembelian → API.
 *
 * Catatan: halaman pakai can('update') yg membaca window.location.pathname,
 * jadi kita set path ke /approval/pembelian sebelum render.
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { loginAll, as } from '../helpers';
import { clickAlertButton } from './_ui';
import { makePembelian } from '../provision';
import InventoryApis from '../../../Services/Inventory.apis';
import ApprovalPembelian from '../../../pages/Approval/ApprovalPembelian/Page';

let pembelian = null;

beforeAll(async () => {
    await loginAll();
    pembelian = await makePembelian({ tipe: 'TUNAI', modal: 1000000, jual: 1400000 }); // APPROVAL
}, 30000);

describe('Halaman Approval Pembelian — owner menyetujui via UI', () => {
    it('buka modal baris → Setujui → konfirmasi → pembelian DISETUJUI + inventory terbentuk', async () => {
        as('owner');
        window.history.pushState({}, '', '/approval/pembelian'); // supaya can('update') = true

        render(<ApprovalPembelian />);

        // baris terbaru (orderBy id desc) = pembelian kita → buka modal view-nya
        const viewButtons = await screen.findAllByTitle('Lihat', {}, { timeout: 15000 });
        fireEvent.click(viewButtons[0]);

        // modal approve → klik Setujui
        fireEvent.click(await screen.findByRole('button', { name: /^Setujui$/ }));

        // dialog konfirmasi showAlert → Setujui
        await clickAlertButton(/Setujui Pembelian/, /^Setujui$/);

        // verifikasi backend: status DISETUJUI + inventory AVAILABLE terbentuk
        await waitFor(async () => {
            as('super');
            const d = await InventoryApis.GetPembelianSingle(pembelian.id);
            expect(d.status).toBe('DISETUJUI');
        }, { timeout: 15000 });

        as('super');
        const inv = (await InventoryApis.GetInventory(`?per_page=50&pembelian_id=${pembelian.id}`))?.data || [];
        expect(inv.some((i) => i.pembelian_id === pembelian.id)).toBe(true);
    }, 45000);
});
