import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import api from "../../services/api";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const unwrap = (res) => {
  const root = res?.data || res;
  if (root && typeof root === "object" && root.data !== undefined) return root.data;
  return root;
};

const AttendanceAdmin = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/attendance");
        const data = unwrap(res);
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

  const tableRows = useMemo(() => rows.slice(0, 50), [rows]);

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Attendance</button>
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.22)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Date</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Employee ID</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Email</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Status</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Check In</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>Check Out</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r?._id || `${r?.user?._id}-${r?.date}`}>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{r?.date || ""}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{r?.user?.employeeId || ""}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{r?.user?.email || ""}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{r?.status || ""}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{r?.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : ""}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{r?.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="dash-note" style={{ padding: 10 }}>Showing latest {tableRows.length} records.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceAdmin;
