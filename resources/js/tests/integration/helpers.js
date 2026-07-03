/**
 * Helper untuk integration suite — semuanya lewat kode FE asli.
 *
 * Login memakai AuthService.login (menembak /api/login, mengisi AuthStore +
 * cookie + PermissionStore). Token tiap role disimpan, lalu `as(role)` menukar
 * sesi aktif di AuthStore — jadi interceptor Apis.js melampirkan token yang
 * benar untuk tiap request berikutnya.
 */
import AuthService from '../../Services/Auth.apis';
import AuthStore from '../../Store/AuthStore';

export const ACC = {
    super: ['tokoemas', 'tokoemas'],
    owner: ['owner', 'password'],
    kasirJkt: ['kasirjkt', 'password'],
    kasirBgr: ['kasirbgr', 'password'],
};

const sessions = {};

/** Login semua role via service asli, simpan {user, token} per role. */
export async function loginAll() {
    for (const [role, [u, p]] of Object.entries(ACC)) {
        const user = await AuthService.login(u, p); // set token global di AuthStore
        sessions[role] = { user, token: AuthStore.getState().token };
    }
    return sessions;
}

/** Aktifkan sesi role tertentu (token dipakai request FE selanjutnya). */
export function as(role) {
    const s = sessions[role];
    if (!s) throw new Error(`Belum login sebagai ${role}`);
    AuthStore.getState().setAuth(s.user, s.token);
    return s;
}

// ── unwrap: service FE tidak konsisten (Get → envelope, Post/Put → wrapper Apis).
// Helper ini menormalkan semuanya jadi payload/list bisnis. ────────────────────
const num = (x) => Number(x || 0);
export { num };

/** Kupas wrapper Apis ({success,data,status}) → sisakan envelope ApiResponse. */
const envelope = (r) => (r && typeof r === 'object' && 'success' in r ? r.data : r);

/** Ambil payload bisnis: envelope.data bila ada, else envelope apa adanya. */
export const payload = (r) => {
    const e = envelope(r);
    return e && typeof e === 'object' && 'data' in e ? e.data : e;
};

/** Ambil list: payload array langsung, atau paginator {data:[...]}. */
export const list = (r) => {
    const p = payload(r);
    if (Array.isArray(p)) return p;
    if (p && Array.isArray(p.data)) return p.data;
    return [];
};
