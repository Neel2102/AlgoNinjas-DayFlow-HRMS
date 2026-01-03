
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
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

const Attendance = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("Day");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [rows, setRows] = useState([]);
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

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await attendanceService.getMyAttendance({ from: range.from, to: range.to });
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
  }, [range.from, range.to]);

  const tableRows = useMemo(() => {
    const byDate = new Map((rows || []).map((r) => [r?.date, r]));
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
    return range.from;
  }, [mode, range.from, range.to]);

  const goPrev = () => {
    setAnchorDate((d) => (mode === "Week" ? addDays(startOfWeekMonday(d), -7) : addDays(d, -1)));
  };

  const goNext = () => {
    setAnchorDate((d) => (mode === "Week" ? addDays(startOfWeekMonday(d), 7) : addDays(d, 1)));
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Attendance</button>
            <button className="dash-tab" onClick={() => navigate("/profile")}>Profile</button>
          </div>

          <div className="att-controls">
            <button className="att-nav" onClick={goPrev} aria-label="Previous">‹</button>
            <div className="att-date">{titleDateLabel}</div>
            <button className="att-nav" onClick={goNext} aria-label="Next">›</button>

            <div className="att-seg">
              <button
                className={`att-seg-btn ${mode === "Day" ? "active" : ""}`}
                onClick={() => setMode("Day")}
              >
                Day
              </button>
              <button
                className={`att-seg-btn ${mode === "Week" ? "active" : ""}`}
                onClick={() => setMode("Week")}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r?._id || r?.date}>
                      <td>{r?.date || ""}</td>
                      <td>{r?.status || ""}</td>
                      <td>{formatTime(r?.checkInAt)}</td>
                      <td>{formatTime(r?.checkOutAt)}</td>
                      <td>{hoursBetween(r?.checkInAt, r?.checkOutAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
