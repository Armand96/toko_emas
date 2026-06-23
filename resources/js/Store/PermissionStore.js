import { create } from 'zustand';
import AuthStore from './AuthStore';

// Role IDs sesuai tabel database
const ROLES = {
    SUPER_ADMIN: 1,
    OWNER: 2,
    PIC: 3,
    KASIR: 4,
};

// Permission levels
const CRUD = ['create', 'read', 'update', 'delete'];
const RU = ['read', 'update'];
const READ = ['read'];

// Hardcoded permission matrix per role
const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        // Super Admin = All Menu
        dashboard: CRUD,
        'approval.penjualan': CRUD,
        'approval.pembelian': CRUD,
        'approval.remove_item': CRUD,
        'approval.transfer': CRUD,
        'inventory.master_kategori': CRUD,
        'inventory.master_produk': CRUD,
        'inventory.pembelian': CRUD,
        'inventory.item_inventory': CRUD,
        'inventory.remove': CRUD,
        'inventory.in_repair': CRUD,
        'inventory.transfer': CRUD,
        'inventory.stock_opname': CRUD,
        penjualan: CRUD,
        finance: CRUD,
        report: CRUD,
        'report.inventory': CRUD,
        'report.pembelian': CRUD,
        'report.penjualan': CRUD,
        'report.finance': CRUD,
        'report.customer': CRUD,
        'administrator.user': CRUD,
        'administrator.cabang': CRUD,
        'administrator.setting': CRUD,
        'administrator.master_bank': CRUD,
        'administrator.supplier': CRUD,
        'administrator.customer': CRUD,
        'administrator.master_category_finance': CRUD,
    },

    [ROLES.OWNER]: {
        dashboard: READ,
        'approval.penjualan': CRUD,
        'approval.pembelian': CRUD,
        'approval.remove_item': CRUD,
        'approval.transfer': CRUD,
        'inventory.master_kategori': CRUD,
        'inventory.master_produk': CRUD,
        'inventory.item_inventory': READ,
        'inventory.remove': READ,
        'inventory.in_repair': READ,
        'inventory.transfer': READ,
        'inventory.stock_opname': READ,
        finance: CRUD,
        report: READ,
        'report.inventory': CRUD,
        'report.pembelian': CRUD,
        'report.penjualan': CRUD,
        'report.finance': CRUD,
        'report.customer': CRUD,
        'administrator.user': CRUD,
        'administrator.cabang': CRUD,
        'administrator.setting': CRUD,
        'administrator.master_bank': CRUD,
        'administrator.supplier': CRUD,
        'administrator.customer': CRUD,
        'administrator.master_category_finance': CRUD,
    },

    [ROLES.PIC]: {
        dashboard: READ,
        'approval.penjualan': RU,
        'approval.pembelian': RU,
        'approval.remove_item': RU,
        'approval.transfer': RU,
        'inventory.master_kategori': READ,
        'inventory.master_produk': CRUD,
        'inventory.item_inventory': READ,
        'inventory.remove': READ,
        'inventory.in_repair': READ,
        'inventory.transfer': READ,
        'inventory.stock_opname': CRUD,
        finance: CRUD,
        report: READ,
        'report.inventory': READ,
        'report.pembelian': READ,
        'report.penjualan': READ,
        'report.finance': READ,
        'report.customer': READ,
        'administrator.user': CRUD,
        'administrator.cabang': CRUD,
        'administrator.setting': CRUD,
        'administrator.master_bank': CRUD,
        'administrator.supplier': CRUD,
        'administrator.customer': CRUD,
        'administrator.master_category_finance': CRUD,
    },

    [ROLES.KASIR]: {
        dashboard: READ,
        'inventory.master_kategori': READ,
        'inventory.master_produk': READ,
        'inventory.pembelian': CRUD,
        'inventory.item_inventory': CRUD,
        'inventory.remove': CRUD,
        'inventory.in_repair': CRUD,
        'inventory.transfer': CRUD,
        'inventory.stock_opname': CRUD,
        penjualan: CRUD,
        'administrator.supplier': CRUD,
        'administrator.customer': CRUD,
    },
};

// Mapping: sidebar item id -> permission key
const MENU_PERMISSION_MAP = {
    dashboard: 'dashboard',
    approval: [
        'approval.penjualan',
        'approval.pembelian',
        'approval.remove_item',
        'approval.transfer',
    ],
    inventory: [
        'inventory.master_kategori',
        'inventory.master_produk',
        'inventory.pembelian',
        'inventory.item_inventory',
        'inventory.remove',
        'inventory.in_repair',
        'inventory.transfer',
        'inventory.stock_opname',
    ],
    penjualan: 'penjualan',
    finance: 'finance',
    report: [
        'report.penjualan',
        'report.pembelian',
        'report.finance',
        'report.customer',
    ],
    user: 'administrator.user',
    cabang: 'administrator.cabang',
    setting: 'administrator.setting',
    MasterBank: 'administrator.master_bank',
    MasterSupplier: 'administrator.supplier',
    MasterCustomer: 'administrator.customer',
    MasterCategoryFinance: 'administrator.master_category_finance',
};

// Mapping: sub-menu link -> permission key
const SUBMENU_PERMISSION_MAP = {
    '/approval/penjualan': 'approval.penjualan',
    '/approval/pembelian': 'approval.pembelian',
    '/approval/remove-item': 'approval.remove_item',
    '/approval/transfer': 'approval.transfer',
    '/inventory/master-kategori': 'inventory.master_kategori',
    '/inventory/master-produk': 'inventory.master_produk',
    '/inventory/pembelian': 'inventory.pembelian',
    '/inventory/inventory': 'inventory.item_inventory',
    '/inventory/remove': 'inventory.remove',
    '/inventory/in-repair': 'inventory.in_repair',
    '/inventory/transfer': 'inventory.transfer',
    '/inventory/stock-opname': 'inventory.stock_opname',
    '/report/penjualan': 'report.penjualan',
    '/report/pembelian': 'report.pembelian',
    '/report/customer': 'report.customer',
    '/report/finance': 'report.finance',
};

// Mapping: route path -> permission key
const ROUTE_PERMISSION_MAP = {
    '/dashboard': 'dashboard',
    '/approval/penjualan': 'approval.penjualan',
    '/approval/pembelian': 'approval.pembelian',
    '/approval/remove-item': 'approval.remove_item',
    '/approval/transfer': 'approval.transfer',
    '/inventory/master-kategori': 'inventory.master_kategori',
    '/inventory/master-produk': 'inventory.master_produk',
    '/inventory/pembelian': 'inventory.pembelian',
    '/inventory/inventory': 'inventory.item_inventory',
    '/inventory/remove': 'inventory.remove',
    '/inventory/in-repair': 'inventory.in_repair',
    '/inventory/transfer': 'inventory.transfer',
    '/inventory/stock-opname': 'inventory.stock_opname',
    '/penjualan': 'penjualan',
    '/finance': 'finance',
    '/report/penjualan': 'report.penjualan',
    '/report/pembelian': 'report.pembelian',
    '/report/customer': 'report.customer',
    '/report/finance': 'report.finance',
    '/administrator/users': 'administrator.user',
    '/administrator/cabang': 'administrator.cabang',
    '/administrator/setting': 'administrator.setting',
    '/administrator/master-bank': 'administrator.master_bank',
    '/administrator/supplier': 'administrator.supplier',
    '/administrator/customer': 'administrator.customer',
    '/administrator/master-category-finance': 'administrator.master_category_finance',
};

const initialUser = AuthStore.getState().user;
const initialRoleId = initialUser?.role_id || null;

const PermissionStore = create((set, get) => ({
    roleId: initialRoleId,
    permissions: ROLE_PERMISSIONS[initialRoleId] || {},

    // Sync permissions dari AuthStore user
    syncFromAuth: () => {
        const user = AuthStore.getState().user;
        const roleId = user?.role_id || null;
        const permissions = ROLE_PERMISSIONS[roleId] || {};
        set({ roleId, permissions });
    },

    // Cek apakah user punya akses ke permission key tertentu
    hasPermission: (permissionKey) => {
        const { permissions } = get();
        return !!permissions[permissionKey];
    },

    // Cek apakah user punya akses dengan action tertentu (create/read/update/delete)
    can: (action, permissionKey) => {
        const { permissions } = get();
        const actions = permissions[permissionKey];
        if (!actions) return false;
        return actions.includes(action);
    },

    // Cek apakah menu item (by id) boleh ditampilkan
    canSeeMenu: (menuId) => {
        const { permissions } = get();
        const mapping = MENU_PERMISSION_MAP[menuId];
        if (!mapping) return true;
        if (Array.isArray(mapping)) {
            return mapping.some((key) => !!permissions[key]);
        }
        return !!permissions[mapping];
    },

    // Cek apakah sub-menu (by link) boleh ditampilkan
    canSeeSubMenu: (link) => {
        const { permissions } = get();
        const key = SUBMENU_PERMISSION_MAP[link];
        if (!key) return true;
        return !!permissions[key];
    },

    // Cek apakah route boleh diakses. `perms` opsional supaya caller bisa
    // mengoper snapshot permission yang sedang dia subscribe (hindari baca stale).
    canAccessRoute: (path, perms) => {
        const permissions = perms || get().permissions;
        const key = ROUTE_PERMISSION_MAP[path];
        if (!key) return true;
        return !!permissions[key];
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

export { ROLES, MENU_PERMISSION_MAP, SUBMENU_PERMISSION_MAP, ROUTE_PERMISSION_MAP };
export default PermissionStore;
