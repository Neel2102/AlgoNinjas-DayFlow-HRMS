import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ redirectTo = "/signin" }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
