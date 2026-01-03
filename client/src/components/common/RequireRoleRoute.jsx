import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const RequireRoleRoute = ({ roles = [], redirectTo = "/dashboard" }) => {
  const { user } = useAuth();
  const role = user?.role;

  if (!role) return <Navigate to={redirectTo} replace />;
  if (roles.length > 0 && !roles.includes(role)) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
};

export default RequireRoleRoute;
