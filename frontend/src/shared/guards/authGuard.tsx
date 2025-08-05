import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface AuthGuardProps {
    children: JSX.Element;
}

const AuthGuard = ({children}: AuthGuardProps) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');

    if (!token && !user) {
        return <Navigate to="/" replace />;
    } else {
        return children;
    }
};

export default AuthGuard;