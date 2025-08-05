import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface RoleGuardProps {
  allowedRoles: string[];
  children: JSX.Element;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const token = localStorage.getItem("token");
  const raw = localStorage.getItem("currentUser");

  if (!token || !raw) {
    return <Navigate to="/login" replace />;
  }

  let role = "user"; // default if missing
  try {
    const user = JSON.parse(raw);
    role = (user?.role ?? "user").toString();
  } catch {
    return <Navigate to="/login" replace />;
  }

  const allowed = allowedRoles.map(r => r.toLowerCase());
  const current = role.toLowerCase();

  return allowed.includes(current)
    ? children
    : <Navigate to="/notFoundPage" replace />;
};

export default RoleGuard;
