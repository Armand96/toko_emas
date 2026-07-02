/**
 * PAGE-DRIVEN E2E — Master Customer (administrator/Customer) CRUD via UI.
 *
 * Create: klik "Tambah Customer" → isi modal → "Tambah".
 * Edit:   cari customer → klik edit → ubah nama → "Simpan Perubahan".
 * Keduanya memicu handleSubmit halaman → CustomerApis.Post/Put → API asli.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { setField } from './_ui';
import CustomerApis from '../../../Services/Customer.apis';
import MasterCustomer from '../../../pages/administrator/Customer/Page';

const stamp = Date.now();
const newName = 'E2E Cust Baru ' + stamp;
let editName = 'E2E Cust Edit ' + stamp;
let editId = null;

beforeAll(async () => {
    await loginAll();
    as('super');
    // customer yg akan diedit lewat UI
    const res = await CustomerApis.PostCustomer({ customer_name: editName, phone_number: '0811' + stamp, address: 'Jl. Awal' });
    editId = (res?.data?.data ?? res?.data)?.id;
}, 30000);

describe('Master Customer — create via UI', () => {
    it('klik Tambah Customer → isi form → Tambah → tercatat di backend', async () => {
        as('super');
        window.history.pushState({}, '', '/administrator/customer');
        render(<MasterCustomer />);

        fireEvent.click(await screen.findByRole('button', { name: /Tambah Customer/i }));

        setField('customer_name', newName);
        setField('phone_number', '081277776666');
        setField('address', 'Jl. Customer Baru 99');

        fireEvent.click(screen.getByRole('button', { name: /^Tambah$/ }));

        await waitFor(async () => {
            as('super');
            const found = list(await CustomerApis.GetCustomer(`?customer_name=${encodeURIComponent(newName)}&limit=20`))
                .some((c) => c.customer_name === newName);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});

describe('Master Customer — edit via UI', () => {
    it('cari customer → edit → ubah nama → Simpan Perubahan → ter-update', async () => {
        const renamed = editName + ' (updated)';
        as('super');
        window.history.pushState({}, '', '/administrator/customer');
        render(<MasterCustomer />);

        // cari by nama supaya baris kita muncul
        fireEvent.change(screen.getByPlaceholderText(/Cari customer/i), { target: { value: editName } });
        const cell = await screen.findByText(editName, {}, { timeout: 15000 });
        fireEvent.click(within(cell.closest('tr')).getByTitle('Ubah'));

        // ubah nama lalu simpan
        const input = document.querySelector('input[name="customer_name"]');
        fireEvent.change(input, { target: { value: renamed } });
        fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/i }));

        await waitFor(async () => {
            as('super');
            const c = list(await CustomerApis.GetCustomer(`?customer_name=${encodeURIComponent(renamed)}&limit=20`))
                .find((x) => x.id === editId);
            expect(c?.customer_name).toBe(renamed);
        }, { timeout: 15000 });
    }, 40000);
});
