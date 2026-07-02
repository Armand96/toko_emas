/**
 * PAGE-DRIVEN E2E — Master User (administrator/user) create via UI.
 * Isi teks + dropdown Cabang & Role + password → "Tambah" → UsersApis.PostUser.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { loginAll, as, list } from '../helpers';
import { setField, selectByLabel } from './_ui';
import UsersApis from '../../../Services/User.apis';
import MasterUser from '../../../pages/administrator/user/Page';

const S = Date.now();
const username = 'e2euser' + String(S).slice(-6);
let roleLabel = null;

beforeAll(async () => {
    await loginAll();
    as('super');
    const roles = list(await UsersApis.GetRole('?per_page=20'));
    roleLabel = (roles.find((r) => /kasir/i.test(r.role_name)) || roles[0])?.role_name;
    if (!roleLabel) throw new Error('Role tak tersedia');
}, 30000);

describe('Master User — create via UI', () => {
    it('isi form + pilih cabang & role → Tambah → user tercatat', async () => {
        as('super');
        window.history.pushState({}, '', '/administrator/users');
        render(<MasterUser />);

        fireEvent.click(await screen.findByRole('button', { name: /Tambah User/i }));

        setField('name', 'E2E User ' + S);
        setField('username', username);
        setField('phone_number', '081255554444');
        setField('email', username + '@mail.com');
        await selectByLabel(/Cabang\/Penempatan/, 'Jakarta');
        await selectByLabel(/^Role/, roleLabel);
        setField('password', 'password123');

        fireEvent.click(screen.getByRole('button', { name: /^Tambah$/ }));

        await waitFor(async () => {
            as('super');
            const found = list(await UsersApis.GetUser('?limit=200')).some((u) => u.username === username);
            expect(found).toBe(true);
        }, { timeout: 15000 });
    }, 40000);
});
