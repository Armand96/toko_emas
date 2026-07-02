/**
 * PAGE-DRIVEN E2E — Master Cabang (administrator/Branch) create via UI.
 * Isi teks + tanggal + dropdown PIC → "Tambah" → BranchApis.PostBranch.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { setField, selectByLabel } from './_ui';
import BranchApis from '../../../Services/Branch.apis';
import UsersApis from '../../../Services/User.apis';
import OptionsStore from '../../../Store/OptionsStore';
import MasterBranch from '../../../pages/administrator/Branch/Page';

const S = Date.now();
const branchName = 'E2E Cabang ' + S;
let picName = null;

beforeAll(async () => {
    await loginAll();
    as('super');
    picName = list(await UsersApis.GetUser('?is_active=1&limit=50')).find((u) => Number(u.is_active) === 1)?.name;
    if (!picName) throw new Error('User aktif utk PIC tak ada');
    OptionsStore.getState().invalidate('users');
}, 30000);

describe('Master Cabang — create via UI', () => {
    it('isi form + pilih PIC → Tambah → cabang tercatat', async () => {
        as('super');
        window.history.pushState({}, '', '/administrator/cabang');
        render(<MasterBranch />);

        fireEvent.click(await screen.findByRole('button', { name: /Tambah Cabang/i }));

        setField('branch_code', 'EC' + String(S).slice(-4));
        setField('branch_name', branchName);
        await selectByLabel(/^PIC/, picName);
        setField('branch_open_date', '2021-05-05');
        setField('lokasi_cabang', 'Depok');
        setField('address', 'Jl. Cabang Baru 10');

        // tombol submit modal cabang di-hardcode "Simpan Perubahan" (juga utk tambah)
        fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/i }));

        await waitFor(async () => {
            as('super');
            const found = list(await BranchApis.GetBranch('?per_page=100')).some((b) => b.branch_name === branchName);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});
