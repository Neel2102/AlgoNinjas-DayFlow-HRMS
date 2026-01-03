
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as leaveService from "../../services/leaveService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const isoDateKey = (d) => {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
};

const LeaveManagement = () => {
  const navigate = useNavigate();

  const [type, setType] = useState("Paid");
  const [startDate, setStartDate] = useState(() => isoDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => isoDateKey(new Date()));
  const [remarks, setRemarks] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await leaveService.getMyLeaves();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    return (rows || []).slice().sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });
  }, [rows]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await leaveService.applyLeave({ type, startDate, endDate, remarks });
      setSuccess("Leave request submitted");
      setRemarks("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Time Off</button>
            <button className="dash-tab" onClick={() => navigate("/attendance")}>Attendance</button>
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {success ? <div className="dash-note">{success}</div> : null}

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Apply Leave</div>
              <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <select className="dash-search" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Paid">Paid</option>
                    <option value="Sick">Sick</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                  <input
                    className="dash-search"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input className="dash-search" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <input className="dash-search" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <button className="dash-action-btn" type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Admin Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No leave requests yet.</td>
                    </tr>
                  ) : (
                    sorted.map((r) => (
                      <tr key={r?._id}>
                        <td>{r?.type || ""}</td>
                        <td>{r?.startDate ? isoDateKey(r.startDate) : ""}</td>
                        <td>{r?.endDate ? isoDateKey(r.endDate) : ""}</td>
                        <td>{r?.status || ""}</td>
                        <td>{r?.remarks || ""}</td>
                        <td>{r?.adminComment || ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;

