import { Navigate, Outlet } from 'react-router';
import AuthService from '../Services/Auth.apis';

const ProtectedRoute = () => {
    if (!AuthService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

export default ProtectedRoute;
