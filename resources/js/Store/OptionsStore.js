import { create } from "zustand";
import InventoryApis from "../Services/Inventory.apis";
import BranchApis from "../Services/Branch.apis";
import BankApis from "../Services/Bank.apis";
import SupplierApis from "../Services/Supplier.apis";
import UsersApis from "../Services/User.apis";

/**
 * Cache global untuk data master yang dipakai sebagai OPSI dropdown di banyak page
 * (products, categories, branches, banks, suppliers). Sebelumnya tiap page fetch
 * sendiri-sendiri sehingga data yang sama diambil berulang kali = pemborosan request.
 *
 * Tiap ensureX():
 *  - kalau sudah pernah dimuat  -> langsung kembalikan data dari cache (tanpa request).
 *  - kalau sedang dalam proses  -> kembalikan promise yang sama (dedup call paralel).
 *  - kalau belum                -> fetch sekali, simpan ke cache.
 *
 * Panggil invalidate('products') setelah create/update master data agar cache
 * di-reset dan ensureX() berikutnya fetch ulang dari server.
 */
const createResource = (set, get, key, fetcher) => async (forceRefresh = false) => {
    const state = get()[key];
    if (!forceRefresh && state.loaded) return state.data;
    if (state.promise) return state.promise;

    const promise = fetcher()
        .then((res) => {
            const data = res?.data || [];
            set((s) => ({ [key]: { ...s[key], data, loaded: true, promise: null } }));
            return data;
        })
        .catch((err) => {
            set((s) => ({ [key]: { ...s[key], promise: null } }));
            console.error(`Error fetching ${key}:`, err);
            return [];
        });

    set((s) => ({ [key]: { ...s[key], promise } }));
    return promise;
};

const initial = { data: [], loaded: false, promise: null };

const OptionsStore = create((set, get) => ({
    products: { ...initial },
    categories: { ...initial },
    branches: { ...initial },
    banks: { ...initial },
    suppliers: { ...initial },
    users: { ...initial },

    ensureProducts: createResource(set, get, "products", () => InventoryApis.GetProducts("?per_page=10000000&is_active=1")),
    ensureCategories: createResource(set, get, "categories", () => InventoryApis.GetCategories("?per_page=10000000&is_active=1")),
    ensureBranches: createResource(set, get, "branches", () => BranchApis.GetBranch("?per_page=10000000&is_active=1")),
    ensureBanks: createResource(set, get, "banks", () => BankApis.GetBankBranch("?per_page=10000000&is_active=1")),
    ensureSuppliers: createResource(set, get, "suppliers", () => SupplierApis.GetSupplier("?per_page=10000000&is_active=1")),
    ensureUsers: createResource(set, get, "users", () => UsersApis.GetUser("?per_page=10000000&is_active=1")),

    invalidate: (key) => set({ [key]: { data: [], loaded: false, promise: null } }),
}));

export default OptionsStore;
