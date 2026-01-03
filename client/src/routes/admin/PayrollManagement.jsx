
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as employeeService from "../../services/employeeService";
import * as payrollService from "../../services/payrollService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const monthKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const PayrollManagement = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [grossPay, setGrossPay] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [netPay, setNetPay] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [notes, setNotes] = useState("");

  const employeeOptions = useMemo(() => {
    return (employees || [])
      .map((e) => ({
        id: e?.user?._id,
        label: `${e?.user?.employeeId || ""} ${e?.personal?.fullName ? `- ${e.personal.fullName}` : ""}`.trim(),
      }))
      .filter((x) => x.id);
  }, [employees]);

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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await payrollService.listPayroll({ userId: selectedUserId || undefined, month: month || undefined });
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
  }, [selectedUserId, month]);

  useEffect(() => {
    const g = Number(grossPay) || 0;
    const d = Number(deductions) || 0;
    setNetPay(Math.max(0, g - d));
  }, [grossPay, deductions]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (!selectedUserId) {
        setError("Select an employee to update payroll");
        return;
      }
      if (!month) {
        setError("Select a month");
        return;
      }
      await payrollService.upsertPayroll({
        userId: selectedUserId,
        month,
        grossPay: Number(grossPay) || 0,
        deductions: Number(deductions) || 0,
        netPay: Number(netPay) || 0,
        currency,
        notes,
      });
      setSuccess("Payroll updated");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Payroll</button>
            <button className="dash-tab" onClick={() => navigate("/admin/leaves")}>Time Off</button>
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

            <input className="dash-search" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {success ? <div className="dash-note">{success}</div> : null}

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Update Payroll</div>
              <form onSubmit={save} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <input
                    className="dash-search"
                    type="number"
                    value={grossPay}
                    onChange={(e) => setGrossPay(e.target.value)}
                    placeholder="Gross pay"
                  />
                  <input
                    className="dash-search"
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    placeholder="Deductions"
                  />
                  <input
                    className="dash-search"
                    type="number"
                    value={netPay}
                    readOnly
                    placeholder="Net pay"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                  <input
                    className="dash-search"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="Currency"
                  />
                  <input
                    className="dash-search"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                  />
                </div>

                <button className="dash-action-btn" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net</th>
                    <th>Currency</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8}>No payroll records.</td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r?._id || `${r?.user?._id}-${r?.month}`}> 
                        <td>{r?.month || ""}</td>
                        <td>{r?.user?.employeeId || ""}</td>
                        <td>{r?.user?.email || ""}</td>
                        <td>{r?.grossPay ?? ""}</td>
                        <td>{r?.deductions ?? ""}</td>
                        <td>{r?.netPay ?? ""}</td>
                        <td>{r?.currency || ""}</td>
                        <td>{r?.notes || ""}</td>
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

export default PayrollManagement;

