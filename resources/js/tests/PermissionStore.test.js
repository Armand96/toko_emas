import { describe, it, expect, beforeEach } from 'vitest';
import PermissionStore, { ROLES } from '../Store/PermissionStore';
import AuthStore from '../Store/AuthStore';

/**
 * RBAC di aplikasi ini by design FE-only, jadi PermissionStore adalah
 * satu-satunya penjaga akses. Test ini mengunci matriks role → izin supaya
 * perubahan tak sengaja pada PERMISSIONS ketahuan.
 */

// Set role aktif lalu paksa store re-hitung izinnya.
function actAs(roleId) {
    AuthStore.setState({ user: roleId ? { role_id: roleId } : null });
    PermissionStore.getState().syncFromAuth();
}

beforeEach(() => actAs(null));

describe('can(action, link)', () => {
    it('Kasir boleh create penjualan, tapi tidak boleh approve', () => {
        actAs(ROLES.KASIR);
        const can = PermissionStore.getState().can;
        expect(can('create', '/transaksi/penjualan')).toBe(true);
        expect(can('update', '/approval/penjualan')).toBe(false);
    });

    it('Owner boleh approve penjualan, tapi tidak boleh input penjualan', () => {
        actAs(ROLES.OWNER);
        const can = PermissionStore.getState().can;
        expect(can('update', '/approval/penjualan')).toBe(true);
        expect(can('create', '/transaksi/penjualan')).toBe(false);
    });

    it('Super Admin boleh segalanya di halaman apa pun', () => {
        actAs(ROLES.SUPER_ADMIN);
        const can = PermissionStore.getState().can;
        for (const action of ['create', 'read', 'update', 'delete']) {
            expect(can(action, '/finance')).toBe(true);
            expect(can(action, '/administrator/users')).toBe(true);
        }
    });

    it('user tanpa role tidak punya izin apa pun', () => {
        const can = PermissionStore.getState().can;
        expect(can('read', '/dashboard')).toBe(false);
    });

    it('memakai window.location.pathname saat link tidak dioper', () => {
        actAs(ROLES.KASIR);
        window.history.pushState({}, '', '/transaksi/pembelian');
        expect(PermissionStore.getState().can('create')).toBe(true);
    });
});

describe('canAccessRoute', () => {
    it('mengizinkan route yang tidak diatur (bukan bagian PERMISSIONS)', () => {
        actAs(ROLES.KASIR);
        expect(PermissionStore.getState().canAccessRoute('/halaman-bebas')).toBe(true);
    });

    it('memblokir route diatur yang tidak diizinkan utk role', () => {
        actAs(ROLES.KASIR);
        // Kasir tidak punya read di /report/finance
        expect(PermissionStore.getState().canAccessRoute('/report/finance')).toBe(false);
    });
});

describe('canSeeMenu', () => {
    it('menu dengan link langsung mengikuti akses route', () => {
        actAs(ROLES.KASIR);
        expect(PermissionStore.getState().canSeeMenu({ link: '/inventory/inventory' })).toBe(true);
        expect(PermissionStore.getState().canSeeMenu({ link: '/report/finance' })).toBe(false);
    });

    it('menu parent tampil kalau minimal satu sub-item bisa diakses', () => {
        actAs(ROLES.KASIR);
        const menu = {
            subItems: [
                { link: '/report/finance' },      // kasir: no
                { link: '/inventory/inventory' },  // kasir: yes
            ],
        };
        expect(PermissionStore.getState().canSeeMenu(menu)).toBe(true);
    });

    it('menu parent disembunyikan kalau semua sub-item tertutup', () => {
        actAs(ROLES.KASIR);
        const menu = { subItems: [{ link: '/report/finance' }, { link: '/report/penjualan' }] };
        expect(PermissionStore.getState().canSeeMenu(menu)).toBe(false);
    });
});

describe('helper role', () => {
    it('mengenali role aktif & memberi nama', () => {
        actAs(ROLES.OWNER);
        const s = PermissionStore.getState();
        expect(s.isOwner()).toBe(true);
        expect(s.isKasir()).toBe(false);
        expect(s.getRoleName()).toBe('Owner');
    });
});
