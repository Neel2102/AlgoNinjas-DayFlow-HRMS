import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import api from "../../services/api";
import * as employeeService from "../../services/employeeService";
import * as attendanceService from "../../services/attendanceService";

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
    return {};
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

const AttendanceAdmin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("present");
  const [mode, setMode] = useState("Day");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedUserId, setSelectedUserId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([]);
  const [presentRows, setPresentRows] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(() => {
    if (mode === "Week") {
      const start = startOfWeekMonday(anchorDate);
      const end = addDays(start, 6);
      return { from: isoDateKey(start), to: isoDateKey(end), start, end };
    }
    const key = isoDateKey(anchorDate);
    return { from: key, to: key, start: new Date(anchorDate), end: new Date(anchorDate) };
  }, [mode, anchorDate]);

  const titleDateLabel = useMemo(() => {
    if (mode === "Week") return `${range.from} - ${range.to}`;
    return range.from;
  }, [mode, range.from, range.to]);

  const goPrev = () => {
    setAnchorDate((d) => (mode === "Week" ? addDays(startOfWeekMonday(d), -7) : addDays(d, -1)));
  };

  const goNext = () => {
    setAnchorDate((d) => (mode === "Week" ? addDays(startOfWeekMonday(d), 7) : addDays(d, 1)));
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
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        if (tab === "present") {
          const payload = await attendanceService.listPresentByDate({ date: range.from });
          if (!mounted) return;
          setPresentRows(Array.isArray(payload?.rows) ? payload.rows : []);
          setPresentCount(Number(payload?.count) || 0);
          setRows([]);
          return;
        }

        const params = { from: range.from, to: range.to };
        if (selectedUserId) params.userId = selectedUserId;
        const res = await api.get("/attendance", { params });
        const data = unwrap(res);
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
        setPresentRows([]);
        setPresentCount(0);
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
  }, [range.from, range.to, selectedUserId, tab]);

  const tableRows = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];

    // When filtering a single employee, show one row per day (with Absent placeholders)
    if (selectedUserId) {
      const byDate = new Map(list.map((r) => [r?.date, r]));
      if (mode === "Day") {
        const r = byDate.get(range.from);
        if (!r) return [{ date: range.from, user: null, status: "Absent", checkInAt: null, checkOutAt: null }];
        return [r];
      }
      const out = [];
      for (let i = 0; i < 7; i += 1) {
        const key = isoDateKey(addDays(range.start, i));
        const r = byDate.get(key);
        out.push(r || { date: key, user: null, status: "Absent", checkInAt: null, checkOutAt: null });
      }
      return out;
    }

    // All employees: show all attendance entries returned by API
    if (mode === "Day") {
      return list
        .filter((r) => String(r?.date || "") === String(range.from || ""))
        .sort((a, b) => String(a?.user?.employeeId || "").localeCompare(String(b?.user?.employeeId || "")));
    }

    // Week: show all rows in range, grouped by date (sorted)
    return list
      .slice()
      .sort((a, b) => {
        const da = String(a?.date || "");
        const db = String(b?.date || "");
        if (da !== db) return da.localeCompare(db);
        return String(a?.user?.employeeId || "").localeCompare(String(b?.user?.employeeId || ""));
      });
  }, [rows, mode, range.from, range.start, selectedUserId]);

  const employeeOptions = useMemo(() => {
    return (employees || []).map((e) => ({
      id: e?.user?._id,
      label: `${e?.user?.employeeId || ""} ${e?.personal?.fullName ? `- ${e.personal.fullName}` : ""}`.trim(),
    })).filter((x) => x.id);
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

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">Attendance</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>Admin / HR view</div>
        </div>

        <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
          <div className="ui-row gap-8">
            <Button variant={tab === "present" ? "primary" : "ghost"} onClick={() => setTab("present")}>Present</Button>
            <Button variant={tab === "records" ? "primary" : "ghost"} onClick={() => setTab("records")}>Records</Button>
          </div>

          <select
            className="ui-input"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            aria-label="Filter employee"
            style={{ width: 300 }}
            disabled={tab === "present"}
          >
            <option value="">All employees</option>
            {employeeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>

          <Button variant="ghost" onClick={goPrev} aria-label="Previous">Prev</Button>
          <Card className="pad" style={{ padding: "10px 12px" }}>
            <div className="ui-small" style={{ fontWeight: 900 }}>{titleDateLabel}</div>
          </Card>
          <Button variant="ghost" onClick={goNext} aria-label="Next">Next</Button>

          <div className="ui-row gap-8">
            <Button variant={mode === "Day" ? "primary" : "ghost"} onClick={() => setMode("Day")}>Day</Button>
            <Button variant={mode === "Week" ? "primary" : "ghost"} onClick={() => setMode("Week")}>Week</Button>
          </div>

          <Button variant="ghost" onClick={() => navigate("/dashboard")}>Back</Button>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      {tab === "present" ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-row between" style={{ flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="ui-title">Present employees</div>
              <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                {titleDateLabel} • {presentCount} present
              </div>
            </div>
            <div className="ui-small ui-muted">Tip: Use Prev/Next to change the day.</div>
          </div>
        </Card>
      ) : null}

      <Card className="pad" padded={false}>
        {loading ? (
          <div className="pad" style={{ padding: 16 }}>
            <div className="ui-small ui-muted">Loading...</div>
          </div>
        ) : tab === "present" ? (
          <Table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Break</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {presentRows.length === 0 ? (
                <tr>
                  <td colSpan={9}>No present employees for this day.</td>
                </tr>
              ) : (
                presentRows.map((r) => (
                  <tr key={r?._id || `${r?.user?._id}-${r?.date}`} style={rowStyle(r)}> 
                    <td>{r?.user?.employeeId || ""}</td>
                    <td>{employeeNameForRow(r)}</td>
                    <td>{r?.user?.email || ""}</td>
                    <td>{r?.status || ""}</td>
                    <td>{formatTime(r?.checkInAt)}</td>
                    <td>{formatTime(r?.checkOutAt)}</td>
                    <td>{hoursBetween(r?.checkInAt, r?.checkOutAt)}</td>
                    <td>{breakHours(r)}</td>
                    <td>{netWorkHours(r)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Break</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r?._id || `${r?.user?._id || "none"}-${r?.date}`} style={rowStyle(r)}>
                  <td>{r?.date || ""}</td>
                  <td>{r?.user?.employeeId || ""}</td>
                  <td>{employeeNameForRow(r)}</td>
                  <td>{r?.user?.email || ""}</td>
                  <td>{r?.status || ""}</td>
                  <td>{formatTime(r?.checkInAt)}</td>
                  <td>{formatTime(r?.checkOutAt)}</td>
                  <td>{hoursBetween(r?.checkInAt, r?.checkOutAt)}</td>
                  <td>{breakHours(r)}</td>
                  <td>{netWorkHours(r)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AttendanceAdmin;
