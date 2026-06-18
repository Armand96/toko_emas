import { Navigate, Outlet } from 'react-router';
import AuthStore from '../Store/AuthStore';

const ProtectedRoute = () => {
    const token = AuthStore((state) => state.token);
    if (!token) return <Navigate to="/login" replace />;
    return <Outlet />;
};

export default ProtectedRoute;
