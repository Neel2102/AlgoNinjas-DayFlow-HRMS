import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import * as authService from "../services/authService";

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = "auth_token";
const STORAGE_USER_KEY = "auth_user";

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY) || "");
  const [user, setUser] = useState(() => safeJsonParse(localStorage.getItem(STORAGE_USER_KEY)));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token);
    else localStorage.removeItem(STORAGE_TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_USER_KEY);
  }, [user]);

  const isAuthenticated = Boolean(token);

  const extractAuthPayload = (res) => {
    const root = res?.data || res;
    if (root && typeof root === "object" && root.data && typeof root.data === "object") {
      return root.data;
    }
    return root;
  };

  const signIn = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await authService.signIn({ email, password });
      const payload = extractAuthPayload(res);
      setToken(payload?.token || "");
      setUser(payload?.user || null);
      return payload;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({ employeeId, email, password, role, adminSecret }) => {
    setLoading(true);
    try {
      const res = await authService.signUp({ employeeId, email, password, role, adminSecret });
      const payload = extractAuthPayload(res);
      setToken(payload?.token || "");
      setUser(payload?.user || null);
      return payload;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
    }),
    [token, user, loading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
