const authConfig = {
    tokenKey: import.meta.env.VITE_TOKEN_KEY || 'toko_emas_token',
    userKey: import.meta.env.VITE_USER_KEY || 'toko_emas_user',
    tokenExpireHours: 6,
    cookieOptions: {
        expires: 6 / 24, // js-cookie uses days
        secure: import.meta.env.PROD, // false di localhost (HTTP), true di production (HTTPS)
        sameSite: 'Strict',
    },
};

export default authConfig;
