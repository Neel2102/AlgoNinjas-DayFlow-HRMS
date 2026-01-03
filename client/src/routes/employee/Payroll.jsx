import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
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

const Payroll = () => {
  const navigate = useNavigate();

  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await payrollService.getMyPayroll({ month });
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
  }, [month]);

  const displayRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.slice().sort((a, b) => String(b?.month || "").localeCompare(String(a?.month || "")));
  }, [rows]);

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Payroll</button>
            <button className="dash-tab" onClick={() => navigate("/leaves")}>Time Off</button>
          </div>

          <div className="att-controls">
            <input className="dash-search" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}

          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Payable Days</th>
                    <th>Gross Pay</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Currency</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No payroll records for this month.</td>
                    </tr>
                  ) : (
                    displayRows.map((r) => (
                      <tr key={r?._id || r?.month}>
                        <td>{r?.month || ""}</td>
                        <td>
                          {r?.payableDays ?? ""}
                          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                            {typeof r?.totalWorkingDays === "number" ? `${r.totalWorkingDays} working` : ""}
                          </div>
                        </td>
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

export default Payroll;
