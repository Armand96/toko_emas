/**
 * PAGE-DRIVEN E2E — Report pages (read-only). Setiap halaman di-render penuh
 * (KPI, chart chart.js, tabel detail) dan menembak ReportApis asli saat mount.
 * Smoke test: halaman mount tanpa crash & judulnya tampil = seluruh pipeline
 * (fetch → state → render chart & tabel) jalan terhadap backend nyata.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { loginAll, as } from '../helpers';
import ReportFinance from '../../../pages/Report/Finance/Page';
import ReportPenjualan from '../../../pages/Report/Penjualan/Page';
import ReportPembelian from '../../../pages/Report/Pembelian/Page';
import ReportInventory from '../../../pages/Report/Inventory/Page';
import ReportCustomer from '../../../pages/Report/Customer/Page';

beforeAll(async () => { await loginAll(); }, 30000);

const cases = [
    { name: 'Finance', path: '/report/finance', Comp: ReportFinance, title: /Report Finance/i, extra: /Detail Transaksi/i },
    { name: 'Penjualan', path: '/report/penjualan', Comp: ReportPenjualan, title: /Report Penjualan/i },
    { name: 'Pembelian', path: '/report/pembelian', Comp: ReportPembelian, title: /Report Pembelian/i },
    { name: 'Inventory', path: '/report/inventory', Comp: ReportInventory, title: /Report Inventory/i },
    { name: 'Customer', path: '/report/customer', Comp: ReportCustomer, title: /Report Customer/i },
];

describe('Report pages — render penuh terhadap API asli', () => {
    for (const c of cases) {
        it(`Report ${c.name} mount & memuat data tanpa crash`, async () => {
            as('super');
            window.history.pushState({}, '', c.path);
            const { Comp } = c;
            render(<Comp />);
            expect(await screen.findByText(c.title, {}, { timeout: 15000 })).toBeInTheDocument();
            if (c.extra) expect(await screen.findByText(c.extra)).toBeInTheDocument();
        }, 30000);
    }
});
