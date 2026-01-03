import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import { useAuth } from "../../context/AuthContext";
import * as employeeService from "../../services/employeeService";
import * as attendanceService from "../../services/attendanceService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const dotClassFromStatus = (status) => {
  if (!status) return "present";
  const s = String(status).toLowerCase();
  if (s.includes("absent")) return "absent";
  if (s.includes("leave")) return "leave";
  if (s.includes("half")) return "half";
  return "present";
};

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const role = user?.role || "employee";
  const isAdmin = role === "admin" || role === "hr";

  const [activeTab, setActiveTab] = useState(isAdmin ? "Employees" : "Attendance");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [attendanceToday, setAttendanceToday] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const myProfile = await employeeService.getMyProfile();
        if (!mounted) return;
        setMe(myProfile);

        if (isAdmin) {
          const list = await employeeService.listEmployees();
          if (!mounted) return;
          setEmployees(Array.isArray(list) ? list : []);
        } else {
          const rows = await attendanceService.getMyAttendance();
          if (!mounted) return;
          const todayKey = new Date().toISOString().slice(0, 10);
          const today = Array.isArray(rows) ? rows.find((r) => r?.date === todayKey) : null;
          setAttendanceToday(today || null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuOpen) return;
      const el = e.target;
      if (el && el.closest && el.closest("[data-avatar-menu]")) return;
      setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return (employees || []).filter((e) => {
      const fullName = e?.personal?.fullName || "";
      const email = e?.user?.email || "";
      const empId = e?.user?.employeeId || "";
      return (
        fullName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        empId.toLowerCase().includes(q)
      );
    });
  }, [employees, search]);

  const avatarUrl = me?.personal?.profilePictureUrl || "";
  const avatarFallback = initials(me?.personal?.fullName || me?.user?.email || user?.email);

  const doLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const doCheckIn = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.checkIn();
      setAttendanceToday(record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const doCheckOut = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.checkOut();
      setAttendanceToday(record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = isAdmin
    ? ["Company", "Employees", "Attendance", "Time Off", "Payroll"]
    : ["Company", "Attendance", "Time Off", "Payroll"];

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "Attendance") {
      navigate("/admin/attendance");
    }
  }, [activeTab, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "Time Off") {
      navigate("/admin/leaves");
    }
  }, [activeTab, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "Payroll") {
      navigate("/admin/payroll");
    }
  }, [activeTab, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) return;
    if (activeTab === "Attendance") {
      navigate("/attendance");
    }
  }, [activeTab, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) return;
    if (activeTab === "Time Off") {
      navigate("/leaves");
    }
  }, [activeTab, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) return;
    if (activeTab === "Payroll") {
      navigate("/payroll");
    }
  }, [activeTab, isAdmin, navigate]);

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            {tabs.map((t) => (
              <button
                key={t}
                className={`dash-tab ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="dash-right" data-avatar-menu>
            <input
              className="dash-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
            />

            <div
              className="dash-avatar"
              role="button"
              tabIndex={0}
              onClick={() => setMenuOpen((s) => !s)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setMenuOpen((s) => !s);
              }}
              aria-label="User menu"
            >
              {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <span>{avatarFallback}</span>}
            </div>
          </div>
        </div>

        {menuOpen ? (
          <div className="dash-menu" data-avatar-menu>
            <button className="dash-menu-btn" onClick={() => navigate("/profile")}>My Profile</button>
            <button className="dash-menu-btn" onClick={doLogout}>Log Out</button>
          </div>
        ) : null}

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}

          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : isAdmin ? (
            <>
              {activeTab === "Employees" ? (
                <div className="dash-grid">
                  {filteredEmployees.map((e) => {
                  const fullName = e?.personal?.fullName || "Employee";
                  const email = e?.user?.email || "";
                  const pic = e?.personal?.profilePictureUrl || "";
                  const status = null;
                  const dot = dotClassFromStatus(status);
                  return (
                    <div
                      key={e?._id || email}
                      className="dash-card"
                      onClick={() => navigate(`/admin/employees/${e?._id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="dash-card-img">
                        {pic ? <img src={pic} alt="profile" /> : <span>{initials(fullName)}</span>}
                      </div>
                      <div>
                        <div className="dash-card-title">{fullName}</div>
                        <div className="dash-card-sub">{email}</div>
                      </div>
                      <div className={`dash-dot ${dot}`} />
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="dash-note">
                  Select a tab. Employees shows the employee list. Attendance opens admin attendance view.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="dash-note">
                Welcome, {me?.personal?.fullName || user?.email}. Use the buttons below to mark attendance.
              </div>

              <div className="dash-actions">
                <button
                  className="dash-action-btn"
                  onClick={doCheckIn}
                  disabled={actionLoading || Boolean(attendanceToday?.checkInAt)}
                >
                  {attendanceToday?.checkInAt ? "Checked In" : "Check In"}
                </button>
                <button
                  className="dash-action-btn secondary"
                  onClick={doCheckOut}
                  disabled={actionLoading || !attendanceToday?.checkInAt || Boolean(attendanceToday?.checkOutAt)}
                >
                  {attendanceToday?.checkOutAt ? "Checked Out" : "Check Out"}
                </button>
              </div>

              <div className="dash-note">
                Today: {attendanceToday?.date || new Date().toISOString().slice(0, 10)}
                <br />
                Status: {attendanceToday?.status || "—"}
              </div>
            </>
          )}

          {selectedEmployee ? null : null}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
