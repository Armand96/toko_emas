import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import AuthStore from '../Store/AuthStore';
import UsersStore from '../Services/User.apis';

const ProtectedRoute = () => {
    const token = AuthStore((state) => state.token);
    const setUser = AuthStore((state) => state.setUser);

    useEffect(() => {
        if (!token) return;
        UsersStore.GetProfile('')
            .then((res) => {
                const user = res?.data || res;
                if (user) setUser(user);
            })
            .catch((err) => console.error(err));
    }, [token]);

    if (!token) return <Navigate to="/login" replace />;
    return <Outlet />;
};

export default ProtectedRoute;
