import { create } from 'zustand';
import AuthStore from './AuthStore';

// Role IDs sesuai tabel database
const ROLES = {
    SUPER_ADMIN: 1,
    OWNER: 2,
    PIC: 3,
    KASIR: 4,
};

const { SUPER_ADMIN, OWNER, PIC, KASIR } = ROLES;
const ACTIONS = ['create', 'read', 'update', 'delete'];

// Satu baris per halaman (diidentifikasi oleh link/route-nya sendiri).
// Tiap action berisi role mana saja yang boleh melakukannya.
const PERMISSIONS = [
    { link: '/dashboard',
        create: [SUPER_ADMIN], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN], delete: [SUPER_ADMIN] },

    { link: '/approval/penjualan',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER] },
    { link: '/approval/buyback',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER] },
    { link: '/approval/pembelian',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER] },
    { link: '/approval/remove-item',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER] },
    { link: '/approval/transfer',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER] },

    { link: '/transaksi/penjualan',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },
    { link: '/transaksi/buyback',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },
    { link: '/transaksi/pembelian',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },

    { link: '/inventory/master-kategori',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/inventory/master-produk',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/inventory/inventory',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },
    { link: '/inventory/inventory/add',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/inventory/remove',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },
    { link: '/inventory/in-repair',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },
    { link: '/inventory/transfer',
        create: [SUPER_ADMIN, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, KASIR], delete: [SUPER_ADMIN, KASIR] },
    { link: '/inventory/stock-opname',
        create: [SUPER_ADMIN, PIC, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, PIC, KASIR], delete: [SUPER_ADMIN, PIC, KASIR] },

    { link: '/finance',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },

    { link: '/report/pembelian',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER], delete: [SUPER_ADMIN, OWNER] },
    { link: '/report/buyback',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER], delete: [SUPER_ADMIN, OWNER] },
    { link: '/report/penjualan',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER], delete: [SUPER_ADMIN, OWNER] },
    { link: '/report/finance',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER], delete: [SUPER_ADMIN, OWNER] },
    { link: '/report/customer',
        create: [SUPER_ADMIN, OWNER], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER], delete: [SUPER_ADMIN, OWNER] },

    { link: '/administrator/users',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/administrator/cabang',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/administrator/setting',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/administrator/master-bank',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
    { link: '/administrator/supplier',
        create: [SUPER_ADMIN, OWNER, PIC, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, OWNER, PIC, KASIR], delete: [SUPER_ADMIN, OWNER, PIC, KASIR] },
    { link: '/administrator/customer',
        create: [SUPER_ADMIN, OWNER, PIC, KASIR], read: [SUPER_ADMIN, OWNER, PIC, KASIR], update: [SUPER_ADMIN, OWNER, PIC, KASIR], delete: [SUPER_ADMIN, OWNER, PIC, KASIR] },
    { link: '/administrator/master-category-finance',
        create: [SUPER_ADMIN, OWNER, PIC], read: [SUPER_ADMIN, OWNER, PIC], update: [SUPER_ADMIN, OWNER, PIC], delete: [SUPER_ADMIN, OWNER, PIC] },
];

const initialUser = AuthStore.getState().user;
const initialRoleId = initialUser?.role_id || null;

const buildPermissions = (roleId) => {
    const permissions = {};
    for (const entry of PERMISSIONS) {
        const actions = ACTIONS.filter((action) => (entry[action] || []).includes(roleId));
        if (actions.length) permissions[entry.link] = actions;
    }
    return permissions;
};

const PermissionStore = create((set, get) => ({
    roleId: initialRoleId,
    permissions: buildPermissions(initialRoleId),

    // Sync permissions dari AuthStore user
    syncFromAuth: () => {
        const user = AuthStore.getState().user;
        const roleId = user?.role_id || null;
        set({ roleId, permissions: buildPermissions(roleId) });
    },

    // Cek apakah user punya akses ke link tertentu (apapun action-nya)
    hasPermission: (link) => !!get().permissions[link],

    // Cek apakah user punya akses dengan action tertentu (create/read/update/delete).
    // `link` opsional — kalau tidak dioper, diambil dari URL browser saat ini
    // (halaman tidak perlu hardcode permission key-nya sendiri).
    can: (action, link) => {
        const resolvedLink = link || window.location.pathname;
        const actions = get().permissions[resolvedLink];
        return !!actions && actions.includes(action);
    },

    // Cek apakah route boleh diakses. `perms` opsional supaya caller bisa
    // mengoper snapshot permission yang sedang dia subscribe (hindari baca stale).
    canAccessRoute: (path, perms) => {
        const permissions = perms || get().permissions;
        const isGoverned = PERMISSIONS.some((entry) => entry.link === path);
        return !isGoverned || !!permissions[path];
    },

    // Cek apakah sub-menu (by link) boleh ditampilkan — sama logicnya dengan route guard.
    canSeeSubMenu: (link) => get().canAccessRoute(link),

    // Cek apakah menu item sidebar boleh ditampilkan. `item` adalah entry dari
    // sidebarData: punya `link` langsung, atau `subItems` (visible kalau ada
    // minimal satu sub-item yang bisa diakses).
    canSeeMenu: (item) => {
        if (item.link) return get().canAccessRoute(item.link);
        if (item.subItems) return item.subItems.some((sub) => get().canAccessRoute(sub.link));
        return true;
    },

    // Helper: cek role
    isSuperAdmin: () => get().roleId === ROLES.SUPER_ADMIN,
    isOwner: () => get().roleId === ROLES.OWNER,
    isPIC: () => get().roleId === ROLES.PIC,
    isKasir: () => get().roleId === ROLES.KASIR,

    getRoleName: () => {
        const names = {
            [ROLES.SUPER_ADMIN]: 'Super Admin',
            [ROLES.OWNER]: 'Owner',
            [ROLES.PIC]: 'PIC',
            [ROLES.KASIR]: 'Kasir',
        };
        return names[get().roleId] || 'Unknown';
    },
}));

// Setiap user di AuthStore berubah (login, setUser dari profile, logout),
// permission langsung disinkronkan tanpa perlu effect di komponen.
AuthStore.subscribe((state, prev) => {
    if (state.user !== prev.user) {
        PermissionStore.getState().syncFromAuth();
    }
});

export { ROLES, PERMISSIONS };
export default PermissionStore;
