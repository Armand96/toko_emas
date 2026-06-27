const isHTTPS = window.location.protocol === 'https:';

const authConfig = {
    tokenKey: import.meta.env.VITE_TOKEN_KEY || 'toko_emas_token',
    userKey: import.meta.env.VITE_USER_KEY || 'toko_emas_user',
    tokenExpireHours: 6,
    cookieOptions: {
        expires: 6 / 24,
        secure: isHTTPS,
        sameSite: isHTTPS ? 'Strict' : 'Lax',
    },
};

export default authConfig;
