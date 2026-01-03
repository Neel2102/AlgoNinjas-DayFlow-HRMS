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
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Attendance;
