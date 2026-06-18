import Cookies from 'js-cookie';
import authConfig from '../utils/authConfig';
import Apis from '../utils/Apis';
import AuthStore from '../Store/AuthStore';

const AuthService = {
    login: async (username, password) => {
        const res = await Apis.Post('api/login', { username, password });
        const token = res?.data?.data?.user?.token;
        const user = res?.data?.data?.user;

        if (!token) throw new Error('Token tidak ditemukan di response');

        Cookies.set(authConfig.tokenKey, token, authConfig.cookieOptions);
        Cookies.set(authConfig.userKey, JSON.stringify(user), authConfig.cookieOptions);
        AuthStore.getState().setAuth(user, token);

        return user;
    },

    logout: async () => {
        try {
            await Apis.Get('api/logout');
        } catch (_) {
            // ignore — clear local state regardless
        }
        Cookies.remove(authConfig.tokenKey);
        Cookies.remove(authConfig.userKey);
        AuthStore.getState().clearAuth();
    },
};

export default AuthService;
