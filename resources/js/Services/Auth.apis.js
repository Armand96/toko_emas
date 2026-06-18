import Cookies from 'js-cookie';
import authConfig from '../utils/authConfig';
import Apis from '../utils/Apis';

const AuthService = {
    login: async (username, password) => {
        const res = await Apis.Post('api/login', { username, password });
        const token = res?.data?.data?.user?.token;
        const user = res?.data?.data?.user;

        if (!token) throw new Error('Token tidak ditemukan di response');

        Cookies.set(authConfig.tokenKey, token, authConfig.cookieOptions);
        Cookies.set(authConfig.userKey, JSON.stringify(user), authConfig.cookieOptions);

        return user;
    },

    logout: async () => {
        try {
            await Apis.Get('api/logout');
        } catch (_) {
            // ignore error — clear local state regardless
        }
        Cookies.remove(authConfig.tokenKey);
        Cookies.remove(authConfig.userKey);
    },

    getToken: () => Cookies.get(authConfig.tokenKey),

    getUser: () => {
        try {
            const raw = Cookies.get(authConfig.userKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    isAuthenticated: () => !!Cookies.get(authConfig.tokenKey),
};

export default AuthService;
