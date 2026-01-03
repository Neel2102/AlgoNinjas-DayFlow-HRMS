import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
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
  const { shellSearch } = useOutletContext() || {};

  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState("");
  const [commentById, setCommentById] = useState({});

  const [activeTab, setActiveTab] = useState("timeoff");

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

  const filteredRows = useMemo(() => {
    const q = String(shellSearch || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const emp = String(r?.user?.employeeId || "").toLowerCase();
      const email = String(r?.user?.email || "").toLowerCase();
      const type = String(r?.type || "").toLowerCase();
      const statusText = String(r?.status || "").toLowerCase();
      return emp.includes(q) || email.includes(q) || type.includes(q) || statusText.includes(q);
    });
  }, [rows, shellSearch]);

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">Time Off</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>Admin / HR approvals</div>
        </div>

        <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
          <div className="ui-row gap-8">
            <Button variant={activeTab === "timeoff" ? "primary" : "ghost"} onClick={() => setActiveTab("timeoff")}>Requests</Button>
            <Button variant={activeTab === "allocation" ? "primary" : "ghost"} onClick={() => setActiveTab("allocation")}>Allocation</Button>
          </div>

          <select className="ui-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ width: 300 }}>
            <option value="">All employees</option>
            {employeeOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>

          <select className="ui-input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 180 }}>
            <option value="">All status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      {activeTab === "allocation" ? (
        <div className="ui-grid cards">
          <Card className="pad">
            <div className="ui-title">Allocation (Coming Next)</div>
            <div className="ui-divider" style={{ margin: "10px 0" }} />
            <div className="ui-small ui-muted" style={{ lineHeight: 1.6 }}>
              Allocation management requires backend support (per-user balances). Requests and approvals are fully working now.
            </div>
          </Card>
          <Card className="pad">
            <div className="ui-title">Note</div>
            <div className="ui-divider" style={{ margin: "10px 0" }} />
            <div className="ui-small ui-muted" style={{ lineHeight: 1.6 }}>
              Employees can view only their own time off records. Admins and HR officers can view and approve/reject requests for all employees.
            </div>
          </Card>
        </div>
      ) : (
        <Card className="pad" padded={false}>
          {loading ? (
            <div className="pad" style={{ padding: 16 }}>
              <div className="ui-small ui-muted">Loading...</div>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Admin Comment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No time off requests found.</td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
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
                            className="ui-input"
                            style={{ height: 36, borderRadius: 10, width: 220 }}
                            value={commentById?.[id] ?? r?.adminComment ?? ""}
                            onChange={(e) => setCommentById((s) => ({ ...s, [id]: e.target.value }))}
                            placeholder="Add comment"
                            disabled={!pending}
                          />
                        </td>
                        <td>
                          <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
                            <Button variant="ghost" disabled={!pending} onClick={() => decide({ id, action: "reject" })}>Reject</Button>
                            <Button variant="primary" disabled={!pending} onClick={() => decide({ id, action: "approve" })}>Approve</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
};

export default LeaveApproval;

