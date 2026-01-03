import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import "../../CSS/ui.css";
import { useAuth } from "../../context/AuthContext";

const initials = (text) => {
  const parts = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
};

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const role = user?.role || user?.user?.role || "employee";
  const isAdmin = role === "admin" || role === "hr";

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const tabs = useMemo(() => {
    if (isAdmin) {
      return [
        { key: "Employees", path: "/admin/employees" },
        { key: "Attendance", path: "/admin/attendance" },
        { key: "Time Off", path: "/admin/leaves" },
        { key: "Payroll", path: "/admin/payroll" },
      ];
    }
    return [
      { key: "Attendance", path: "/attendance" },
      { key: "Time Off", path: "/leaves" },
      { key: "Payroll", path: "/payroll" },
    ];
  }, [isAdmin]);

  const activeKey = useMemo(() => {
    const p = location.pathname || "";
    const hit = tabs.find((t) => p.startsWith(t.path));
    return hit?.key || "";
  }, [location.pathname, tabs]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuOpen) return;
      const el = e.target;
      if (el && el.closest && el.closest("[data-ui-menu]")) return;
      setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  const avatarText = initials(user?.email || user?.user?.email || "User");

  const logout = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="ui-page">
      <div className="ui-topbar">
        <div className="ui-topbar-inner">
          <div className="ui-row gap-12">
            <div className="ui-brand" role="button" tabIndex={0} onClick={() => navigate(isAdmin ? "/admin/employees" : "/dashboard")}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(isAdmin ? "/admin/employees" : "/dashboard");
              }}
            >
              <div className="ui-brand-mark">D</div>
              <div>
                <div style={{ fontWeight: 1000, lineHeight: 1 }}>Dayflow</div>
                <div className="ui-small ui-muted" style={{ marginTop: 2 }}>HRMS</div>
              </div>
            </div>

            <div className="ui-tabbar">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={["ui-tab", activeKey === t.key ? "active" : ""].filter(Boolean).join(" ")}
                  onClick={() => navigate(t.path)}
                >
                  {t.key}
                </button>
              ))}
            </div>
          </div>

          <div className="ui-right" data-ui-menu>
            <input
              className="ui-input"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />

            <div
              className="ui-avatar"
              role="button"
              tabIndex={0}
              onClick={() => setMenuOpen((s) => !s)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setMenuOpen((s) => !s);
              }}
              aria-label="User menu"
            >
              {avatarText}
            </div>

            {menuOpen ? (
              <div className="ui-menu" data-ui-menu>
                <button className="ui-menu-btn" onClick={() => navigate("/profile")}>My Profile</button>
                <button className="ui-menu-btn" onClick={logout}>Log Out</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="ui-shell">
        <Outlet context={{ shellSearch: search }} />
      </div>
    </div>
  );
};

export default AppShell;
