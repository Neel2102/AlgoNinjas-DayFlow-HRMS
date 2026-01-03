import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
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
  const { shellSearch } = useOutletContext() || {};

  const [type, setType] = useState("Paid");
  const [startDate, setStartDate] = useState(() => isoDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => isoDateKey(new Date()));
  const [remarks, setRemarks] = useState("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState("timeoff");

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

  const filteredRows = useMemo(() => {
    const q = String(shellSearch || "").trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => {
      const t = String(r?.type || "").toLowerCase();
      const s = String(r?.status || "").toLowerCase();
      const rm = String(r?.remarks || "").toLowerCase();
      return t.includes(q) || s.includes(q) || rm.includes(q);
    });
  }, [sorted, shellSearch]);

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">Time Off</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>Apply and track leave requests</div>
        </div>
        <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
          <div className="ui-row gap-8">
            <Button variant={activeTab === "timeoff" ? "primary" : "ghost"} onClick={() => setActiveTab("timeoff")}>Requests</Button>
            <Button variant={activeTab === "allocation" ? "primary" : "ghost"} onClick={() => setActiveTab("allocation")}>Types</Button>
          </div>
          <Button variant="primary" onClick={() => setShowNewModal(true)}>New Request</Button>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}
      {success ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{success}</div>
        </Card>
      ) : null}

      <Modal title="New Time Off Request" open={showNewModal} onClose={() => setShowNewModal(false)}>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="ui-small ui-muted">Type</div>
            <select className="ui-input" value={type} onChange={(e) => setType(e.target.value)} required>
              <option value="Paid">Paid time off</option>
              <option value="Sick">Sick leave</option>
              <option value="Unpaid">Unpaid leave</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="ui-small ui-muted">Start date</div>
              <input className="ui-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="ui-small ui-muted">End date</div>
              <input className="ui-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div className="ui-small ui-muted">Remarks</div>
            <input className="ui-input" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </div>

          <div className="ui-row between" style={{ marginTop: 4, gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </form>
      </Modal>

      {activeTab === "allocation" ? (
        <div className="ui-grid cards">
          <Card className="pad">
            <div className="ui-title">TimeOff Types</div>
            <div className="ui-divider" style={{ margin: "10px 0" }} />
            <div className="ui-small">- Paid Time Off</div>
            <div className="ui-small">- Sick Leave</div>
            <div className="ui-small">- Unpaid Leave</div>
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
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Admin Comment</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No time off requests yet.</td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
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
            </Table>
          )}
        </Card>
      )}
    </div>
  );
};

export default LeaveManagement;

