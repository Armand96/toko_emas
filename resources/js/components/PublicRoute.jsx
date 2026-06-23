import { Navigate, Outlet } from 'react-router';
import AuthStore from '../Store/AuthStore';

/**
 * Guard untuk halaman publik (mis. /login). Kalau user sudah punya token
 * (sudah login), langsung dilempar ke dashboard supaya tidak bisa membuka
 * halaman login lagi.
 */
const PublicRoute = () => {
    const token = AuthStore((state) => state.token);

    if (token) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};

export default PublicRoute;
