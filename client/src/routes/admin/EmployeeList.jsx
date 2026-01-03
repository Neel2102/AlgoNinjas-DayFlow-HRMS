
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as employeeService from "../../services/employeeService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
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

const EmployeeList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await employeeService.listEmployees();
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
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
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return (rows || []).filter((e) => {
      const fullName = e?.personal?.fullName || "";
      const email = e?.user?.email || "";
      const empId = e?.user?.employeeId || "";
      return (
        fullName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        empId.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Employees</button>
            <button className="dash-tab" onClick={() => navigate("/admin/attendance")}>Attendance</button>
            <button className="dash-tab" onClick={() => navigate("/admin/leaves")}>Time Off</button>
            <button className="dash-tab" onClick={() => navigate("/admin/payroll")}>Payroll</button>
          </div>

          <div className="dash-right">
            <input
              className="dash-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
            />
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="dash-grid">
              {filtered.map((e) => {
                const fullName = e?.personal?.fullName || "Employee";
                const email = e?.user?.email || "";
                const empId = e?.user?.employeeId || "";
                const pic = e?.personal?.profilePictureUrl || "";

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
                      <div className="dash-card-sub">{empId}</div>
                      <div className="dash-card-sub">{email}</div>
                    </div>
                    <div className="dash-dot present" />
                  </div>
                );
              })}

              {filtered.length === 0 ? <div className="dash-note">No employees found.</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
