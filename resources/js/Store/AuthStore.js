import { create } from 'zustand';
import Cookies from 'js-cookie';
import authConfig from '../utils/authConfig';

const hydrate = () => {
    try {
        const raw = Cookies.get(authConfig.userKey);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const AuthStore = create((set) => ({
    user: hydrate(),
    token: Cookies.get(authConfig.tokenKey) || null,

    setAuth: (user, token) => set({ user, token }),
    setUser: (user) => {
        Cookies.set(authConfig.userKey, JSON.stringify(user), authConfig.cookieOptions);
        set({ user });
    },
    clearAuth: () => set({ user: null, token: null }),
}));

export default AuthStore;
