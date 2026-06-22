import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import AuthStore from '../Store/AuthStore';
import PermissionStore from '../Store/PermissionStore';
import UsersStore from '../Services/User.apis';

const ProtectedRoute = () => {
    const token = AuthStore((state) => state.token);
    const setUser = AuthStore((state) => state.setUser);
    // Subscribe ke permissions agar komponen re-render saat permission tersinkron
    // (PermissionStore otomatis sync dari perubahan user di AuthStore).
    const permissions = PermissionStore((state) => state.permissions);
    const location = useLocation();

    useEffect(() => {
        if (!token) return;
        UsersStore.GetProfile('')
            .then((res) => {
                const u = res?.data || res;
                if (u) setUser(u);
            })
            .catch((err) => console.error(err));
    }, [token]);

    if (!token) return <Navigate to="/login" replace />;

    // Jangan render tree terproteksi (sidebar dll) selama permission belum
    // ke-resolve. Kalau dirender duluan, daftar menu berubah dari kosong ke
    // terisi saat profil datang dan memicu "removeChild" di tengah transisi.
    if (Object.keys(permissions).length === 0) return null;

    if (!PermissionStore.getState().canAccessRoute(location.pathname, permissions)) {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
};

export default ProtectedRoute;
