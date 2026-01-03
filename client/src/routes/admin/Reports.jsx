import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import * as attendanceService from "../../services/attendanceService";

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

const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
};

const startOfWeekMonday = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  const diff = (day + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  return dt;
};

const Reports = () => {
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(() => {
    const start = startOfWeekMonday(weekStart);
    const end = addDays(start, 6);
    return { start, end, from: isoDateKey(start), to: isoDateKey(end) };
  }, [weekStart]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await attendanceService.getWeeklySummary({ from: range.from });
        if (!mounted) return;
        setSummary(data || null);
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
  }, [range.from]);

  const goPrev = () => {
    setWeekStart((d) => addDays(startOfWeekMonday(d), -7));
  };

  const csvEscape = (val) => {
    const s = String(val ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadAttendanceCsv = () => {
    const days = Array.isArray(summary?.days) ? summary.days : [];
    const rows = [
      ["From", range.from],
      ["To", range.to],
      ["Total employees", summary?.totalEmployees ?? ""],
      [],
      ["Date", "Present", "Leave", "Absent"],
      ...days.map((d) => [d?.date, d?.present ?? 0, d?.leave ?? 0, d?.absent ?? 0]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${range.from}_to_${range.to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    const days = Array.isArray(summary?.days) ? summary.days : [];
    let present = 0;
    let leave = 0;
    let absent = 0;
    for (const d of days) {
      present += Number(d?.present) || 0;
      leave += Number(d?.leave) || 0;
      absent += Number(d?.absent) || 0;
    }
    return { present, leave, absent };
  }, [summary]);

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">Analytics & Reports</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>Admin / HR</div>
        </div>
        <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={goPrev} aria-label="Previous week">Prev week</Button>
          <Card className="pad" style={{ padding: "10px 12px" }}>
            <div className="ui-small" style={{ fontWeight: 900 }}>{range.from} - {range.to}</div>
          </Card>
          <Button variant="ghost" onClick={() => navigate("/admin/employees")}>Back</Button>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      <div className="ui-grid cards" style={{ marginBottom: 12 }}>
        <Card className="pad">
          <div className="ui-small ui-muted">Employees</div>
          <div className="ui-title" style={{ marginTop: 6 }}>{loading ? "—" : (summary?.totalEmployees ?? "—")}</div>
        </Card>
        <Card className="pad">
          <div className="ui-small ui-muted">Week present (sum)</div>
          <div className="ui-title" style={{ marginTop: 6 }}>{loading ? "—" : totals.present}</div>
        </Card>
        <Card className="pad">
          <div className="ui-small ui-muted">Week leave (sum)</div>
          <div className="ui-title" style={{ marginTop: 6 }}>{loading ? "—" : totals.leave}</div>
        </Card>
        <Card className="pad">
          <div className="ui-small ui-muted">Week absent (sum)</div>
          <div className="ui-title" style={{ marginTop: 6 }}>{loading ? "—" : totals.absent}</div>
        </Card>
      </div>

      <Card className="pad">
        <div className="ui-title">Reports</div>
        <div className="ui-divider" style={{ margin: "10px 0" }} />
        <div className="ui-row between" style={{ flexWrap: "wrap", gap: 10 }}>
          <div className="ui-small ui-muted" style={{ lineHeight: 1.7 }}>
            Attendance report (weekly)
            <br />
            Salary slips (coming soon)
          </div>
          <div className="ui-row gap-8">
            <Button onClick={downloadAttendanceCsv} disabled={loading || !summary}>Download Attendance CSV</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
