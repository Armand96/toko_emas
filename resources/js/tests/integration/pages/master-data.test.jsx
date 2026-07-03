/**
 * PAGE-DRIVEN E2E — Master data sederhana (Supplier, Kategori, Bank, Kategori
 * Finance). Semua pakai pola sama: klik "Tambah X" → isi modal → "Tambah" →
 * handleSubmit halaman → Service Post → API asli. Diverifikasi ke backend.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { setField, selectByLabel } from './_ui';
import SupplierApis from '../../../Services/Supplier.apis';
import InventoryApis from '../../../Services/Inventory.apis';
import BankApis from '../../../Services/Bank.apis';
import FinanceApis from '../../../Services/Finance.apis';
import MasterSupplier from '../../../pages/administrator/Supplier/Page';
import MasterKategori from '../../../pages/Inventory/MasterKategori/Page';
import MasterBank from '../../../pages/administrator/MasterBank/Page';
import MasterCategoryFinance from '../../../pages/administrator/MasterCategoryFinance/Page';

const S = Date.now();

beforeAll(async () => { await loginAll(); }, 30000);

async function openAdd(pathname, PageComp, addButtonRe) {
    as('super');
    window.history.pushState({}, '', pathname);
    render(<PageComp />);
    fireEvent.click(await screen.findByRole('button', { name: addButtonRe }));
}

describe('Master Supplier — create', () => {
    it('Tambah Supplier via UI → tercatat', async () => {
        const name = 'E2E Supplier ' + S;
        await openAdd('/administrator/supplier', MasterSupplier, /Tambah Supplier/i);
        setField('supplier_name', name);
        setField('phone_number', '081200001111');
        setField('address', 'Jl. Supplier 1');
        fireEvent.click(screen.getByRole('button', { name: /^Tambah$/ }));

        await waitFor(async () => {
            as('super');
            const found = list(await SupplierApis.GetSupplier(`?supplier_name=${encodeURIComponent(name)}&per_page=20`))
                .some((x) => x.supplier_name === name);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});

describe('Master Kategori — create', () => {
    it('Tambah Kategori via UI → tercatat', async () => {
        const name = 'E2E Kategori ' + S;
        await openAdd('/inventory/master-kategori', MasterKategori, /Tambah Kategori/i);
        setField('category_name', name);
        setField('category_code', 'EK' + String(S).slice(-5));
        setField('description', 'Kategori uji e2e');
        fireEvent.click(screen.getByRole('button', { name: /^Tambah$/ }));

        await waitFor(async () => {
            as('super');
            const found = list(await InventoryApis.GetCategories(`?category_name=${encodeURIComponent(name)}&per_page=20`))
                .some((x) => x.category_name === name);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});

describe('Master Bank — create', () => {
    it('Tambah Bank via UI → tercatat', async () => {
        const name = 'E2E Bank ' + S;
        await openAdd('/administrator/master-bank', MasterBank, /Tambah Bank/i);
        setField('bank_code', 'EB' + String(S).slice(-4));
        setField('bank_name', name);
        fireEvent.click(screen.getByRole('button', { name: /^Tambah$/ }));

        await waitFor(async () => {
            as('super');
            const found = list(await BankApis.GetBankMaster(`?bank_name=${encodeURIComponent(name)}&limit=20`))
                .some((x) => x.bank_name === name);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});

describe('Master Kategori Finance — create (dgn dropdown Tipe)', () => {
    it('Tambah Kategori Finance via UI (type Cash In) → tercatat', async () => {
        const name = 'E2E KatFin ' + S;
        await openAdd('/administrator/master-category-finance', MasterCategoryFinance, /Tambah Kategori/i);
        setField('category_name', name);
        await selectByLabel(/^Tipe/, 'Cash In');
        fireEvent.click(screen.getByRole('button', { name: /^Tambah$/ }));

        await waitFor(async () => {
            as('super');
            const found = list(await FinanceApis.GetCategoryFinance('?per_page=100'))
                .some((x) => x.category_name === name);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});
