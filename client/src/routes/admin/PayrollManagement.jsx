
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as employeeService from "../../services/employeeService";
import * as payrollService from "../../services/payrollService";
import { toast } from "react-toastify";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [genLoading, setGenLoading] = useState(false);

  const employeeOptions = useMemo(() => {
    return (employees || [])
      .map((e) => ({
        id: e?.user?._id,
        label: `${e?.user?.employeeId || ""} ${e?.personal?.fullName ? `- ${e.personal.fullName}` : ""}`.trim(),
      }))
      .filter((x) => x.id);
  }, [employees]);

  const nameByUserId = useMemo(() => {
    const m = new Map();
    for (const e of employees || []) {
      const id = e?.user?._id;
      if (!id) continue;
      const name = String(e?.personal?.fullName || "").trim();
      if (name) m.set(String(id), name);
    }
    return m;
  }, [employees]);

  const employeeNameForRow = (r) => {
    const uid = r?.user?._id;
    const name = uid ? nameByUserId.get(String(uid)) : "";
    if (name) return name;
    return r?.user?.employeeId || r?.user?.email || "";
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

  const generateForSelected = async () => {
    setGenLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!selectedUserId) {
        const msg = "Select an employee to generate payroll";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (!month) {
        const msg = "Select a month";
        setError(msg);
        toast.error(msg);
        return;
      }
      await payrollService.generatePayrollForUser({ userId: selectedUserId, month });
      setSuccess("Payroll generated from salary structure");
      toast.success("Payroll generated for selected employee");
      await load();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setGenLoading(false);
    }
  };

  const generateForAll = async () => {
    setGenLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!month) {
        const msg = "Select a month";
        setError(msg);
        toast.error(msg);
        return;
      }
      const res = await payrollService.generatePayrollForAll({ month });
      setSuccess(`Payroll generated for ${res?.generated ?? "all"} employees`);
      toast.success("Payroll generated");
      await load();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setGenLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, month]);

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-body">
          <div className="ui-row between gap-12" style={{ flexWrap: "wrap" }}>
            <div className="ui-h2">Payroll</div>
            <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
              <select className="ui-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ height: 40 }}>
                <option value="">All employees</option>
                {employeeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input className="ui-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 180 }} />
            </div>
          </div>

          {error ? <div className="dash-note">{error}</div> : null}
          {success ? <div className="dash-note">{success}</div> : null}

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>Payroll Actions</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="dash-action-btn" type="button" disabled={genLoading} onClick={generateForSelected}>
                    {genLoading ? "Working..." : "Generate for selected"}
                  </button>
                  <button className="dash-action-btn" type="button" disabled={genLoading} onClick={generateForAll}>
                    {genLoading ? "Working..." : "Generate for all"}
                  </button>
                </div>
              </div>
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Payable Days</th>
                    <th>Unpaid</th>
                    <th>Missing</th>
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
                      <td colSpan={12}>No payroll records.</td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r?._id || `${r?.user?._id}-${r?.month}`}> 
                        <td>{r?.month || ""}</td>
                        <td>{r?.user?.employeeId || ""}</td>
                        <td>{employeeNameForRow(r)}</td>
                        <td>{r?.user?.email || ""}</td>
                        <td>{r?.payableDays ?? ""}</td>
                        <td>{r?.unpaidLeaveDays ?? ""}</td>
                        <td>{r?.missingAttendanceDays ?? ""}</td>
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

