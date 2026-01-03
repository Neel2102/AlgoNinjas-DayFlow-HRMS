import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
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

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const hoursBetween = (a, b) => {
  if (!a || !b) return "";
  const da = new Date(a);
  const db = new Date(b);
  const ms = db.getTime() - da.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "";
  const hrs = ms / (1000 * 60 * 60);
  return `${hrs.toFixed(1)}h`;
};

const breakHours = (r) => {
  const sessions = Array.isArray(r?.breaks) ? r.breaks : [];
  let total = 0;
  for (const s of sessions) {
    const a = s?.startAt ? new Date(s.startAt).getTime() : NaN;
    const b = s?.endAt ? new Date(s.endAt).getTime() : NaN;
    if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) total += b - a;
  }
  if (r?.breakStartAt) {
    const a = new Date(r.breakStartAt).getTime();
    const n = Date.now();
    if (!Number.isNaN(a) && n > a) total += n - a;
  }
  if (!total) return "";
  return `${(total / (1000 * 60 * 60)).toFixed(1)}h`;
};

const netWorkHours = (r) => {
  if (!r?.checkInAt || !r?.checkOutAt) return "";
  const a = new Date(r.checkInAt).getTime();
  const b = new Date(r.checkOutAt).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return "";
  const gross = b - a;
  const sessions = Array.isArray(r?.breaks) ? r.breaks : [];
  let br = 0;
  for (const s of sessions) {
    const sa = s?.startAt ? new Date(s.startAt).getTime() : NaN;
    const sb = s?.endAt ? new Date(s.endAt).getTime() : NaN;
    if (!Number.isNaN(sa) && !Number.isNaN(sb) && sb > sa) br += sb - sa;
  }
  const net = Math.max(0, gross - br);
  return `${(net / (1000 * 60 * 60)).toFixed(1)}h`;
};

const rowStyle = (r) => {
  const existsInDb = Boolean(r?._id);
  const status = String(r?.status || "Absent");
  const leaveType = String(r?.leaveType || "");

  if (!existsInDb) {
    return { background: "#f3f4f6" };
  }

  if (status === "Present" || status === "Half-day") {
    return { background: "#dcfce7" };
  }

  if (status === "Leave") {
    if (leaveType === "Paid" || leaveType === "Sick") return { background: "#dbeafe" };
    return { background: "#fef9c3" };
  }

  if (status === "Absent") {
    return { background: "#fee2e2" };
  }

  return {};
};

const monthKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const Attendance = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("Month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(() => {
    if (mode === "Week") {
      const start = startOfWeekMonday(anchorDate);
      const end = addDays(start, 6);
      return { from: isoDateKey(start), to: isoDateKey(end), start, end };
    }
    if (mode === "Month") {
      return { from: null, to: null, start: null, end: null };
    }
    const key = isoDateKey(anchorDate);
    return { from: key, to: key, start: new Date(anchorDate), end: new Date(anchorDate) };
  }, [mode, anchorDate]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        if (mode === "Month") {
          const payload = await attendanceService.getMyMonthAttendance({ month });
          if (!mounted) return;
          setRows(Array.isArray(payload?.rows) ? payload.rows : []);
          setSummary(payload?.summary || null);
          return;
        }

        const data = await attendanceService.getMyAttendance({ from: range.from, to: range.to });
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
        setSummary(null);
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
  }, [range.from, range.to, mode, month]);

  const tableRows = useMemo(() => {
    const byDate = new Map((rows || []).map((r) => [r?.date, r]));
    if (mode === "Month") {
      return rows || [];
    }
    if (mode === "Day") {
      const d = byDate.get(range.from);
      return d ? [d] : [{ date: range.from, status: "Absent", checkInAt: null, checkOutAt: null }];
    }

    const out = [];
    for (let i = 0; i < 7; i += 1) {
      const key = isoDateKey(addDays(range.start, i));
      const r = byDate.get(key);
      out.push(r || { date: key, status: "Absent", checkInAt: null, checkOutAt: null });
    }
    return out;
  }, [rows, mode, range.from, range.start]);

  const titleDateLabel = useMemo(() => {
    if (mode === "Week") {
      return `${range.from} - ${range.to}`;
    }
    if (mode === "Month") {
      return month;
    }
    return range.from;
  }, [mode, range.from, range.to, month]);

  const goPrev = () => {
    if (mode === "Month") {
      const [y, m] = String(month).split("-").map((x) => Number(x));
      const d = new Date(y, m - 2, 1);
      setMonth(monthKey(d));
      return;
    }
    setAnchorDate((d) => (mode === "Week" ? addDays(startOfWeekMonday(d), -7) : addDays(d, -1)));
  };

  const goNext = () => {
    if (mode === "Month") {
      const [y, m] = String(month).split("-").map((x) => Number(x));
      const d = new Date(y, m, 1);
      setMonth(monthKey(d));
      return;
    }
    setAnchorDate((d) => (mode === "Week" ? addDays(startOfWeekMonday(d), 7) : addDays(d, 1)));
  };

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">Attendance</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>Daily / weekly view</div>
        </div>
        <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={goPrev} aria-label="Previous">Prev</Button>
          <Card className="pad" style={{ padding: "10px 12px" }}>
            <div className="ui-small" style={{ fontWeight: 900 }}>{titleDateLabel}</div>
          </Card>
          <Button variant="ghost" onClick={goNext} aria-label="Next">Next</Button>
          <div className="ui-row gap-8">
            <Button variant={mode === "Month" ? "primary" : "ghost"} onClick={() => setMode("Month")}>Month</Button>
            <Button variant={mode === "Day" ? "primary" : "ghost"} onClick={() => setMode("Day")}>Day</Button>
            <Button variant={mode === "Week" ? "primary" : "ghost"} onClick={() => setMode("Week")}>Week</Button>
          </div>
          {mode === "Month" ? (
            <input
              className="ui-input"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Select month"
              style={{ width: 160 }}
            />
          ) : null}
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>Back</Button>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      {mode === "Month" ? (
        <div className="ui-grid cards" style={{ marginBottom: 12 }}>
          <Card className="pad">
            <div className="ui-small ui-muted">Days present</div>
            <div className="ui-title" style={{ marginTop: 6 }}>{summary?.presentDays ?? "—"}</div>
          </Card>
          <Card className="pad">
            <div className="ui-small ui-muted">Leaves count</div>
            <div className="ui-title" style={{ marginTop: 6 }}>{summary?.leaveDays ?? "—"}</div>
          </Card>
          <Card className="pad">
            <div className="ui-small ui-muted">Total working days</div>
            <div className="ui-title" style={{ marginTop: 6 }}>{summary?.totalWorkingDays ?? "—"}</div>
          </Card>
          <Card className="pad">
            <div className="ui-small ui-muted">Payable days</div>
            <div className="ui-title" style={{ marginTop: 6 }}>{summary?.payableDays ?? "—"}</div>
          </Card>
        </div>
      ) : null}

      <Card className="pad" padded={false}>
        {loading ? (
          <div className="pad" style={{ padding: 16 }}>
            <div className="ui-small ui-muted">Loading...</div>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Break</th>
                <th>Net</th>
                {mode === "Month" ? <th>Extra</th> : null}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r?._id || r?.date} style={rowStyle(r)}>
                  <td>{r?.date || ""}</td>
                  <td>{r?.status || ""}</td>
                  <td>{formatTime(r?.checkInAt)}</td>
                  <td>{formatTime(r?.checkOutAt)}</td>
                  <td>{hoursBetween(r?.checkInAt, r?.checkOutAt)}</td>
                  <td>{breakHours(r)}</td>
                  <td>{netWorkHours(r)}</td>
                  {mode === "Month" ? (
                    <td className="ui-small ui-muted">{r?.leaveType ? `Leave: ${r.leaveType}` : ""}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Attendance;
