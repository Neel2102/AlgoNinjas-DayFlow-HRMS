
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as employeeService from "../../services/employeeService";
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

const LeaveApproval = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState("");
  const [commentById, setCommentById] = useState({});

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await leaveService.listLeaves({ status: status || undefined, userId: selectedUserId || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const list = await employeeService.listEmployees();
        if (!mounted) return;
        setEmployees(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setEmployees([]);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, status]);

  const employeeOptions = useMemo(() => {
    return (employees || []).map((e) => ({
      id: e?.user?._id,
      label: `${e?.user?.employeeId || ""} ${e?.personal?.fullName ? `- ${e.personal.fullName}` : ""}`.trim(),
    })).filter((x) => x.id);
  }, [employees]);

  const decide = async ({ id, action }) => {
    setError("");
    try {
      const comment = commentById?.[id] || "";
      if (action === "approve") {
        await leaveService.approveLeave({ id, comment });
      } else {
        await leaveService.rejectLeave({ id, comment });
      }
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Leave Approvals</button>
            <button className="dash-tab" onClick={() => navigate("/admin/attendance")}>Attendance</button>
          </div>

          <div className="att-controls">
            <select className="dash-search" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">All employees</option>
              {employeeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <select className="dash-search" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table" style={{ minWidth: 920 }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Comment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8}>No leave requests.</td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const pending = r?.status === "Pending";
                      const id = r?._id;
                      return (
                        <tr key={id}>
                          <td>{r?.user?.employeeId || ""}</td>
                          <td>{r?.user?.email || ""}</td>
                          <td>{r?.type || ""}</td>
                          <td>{r?.startDate ? isoDateKey(r.startDate) : ""}</td>
                          <td>{r?.endDate ? isoDateKey(r.endDate) : ""}</td>
                          <td>{r?.status || ""}</td>
                          <td>
                            <input
                              className="dash-search"
                              value={commentById?.[id] ?? r?.adminComment ?? ""}
                              onChange={(e) => setCommentById((s) => ({ ...s, [id]: e.target.value }))}
                              placeholder="Admin comment"
                              disabled={!pending}
                            />
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                className="dash-tab"
                                disabled={!pending}
                                onClick={() => decide({ id, action: "approve" })}
                              >
                                Approve
                              </button>
                              <button
                                className="dash-tab"
                                disabled={!pending}
                                onClick={() => decide({ id, action: "reject" })}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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

export default LeaveApproval;

