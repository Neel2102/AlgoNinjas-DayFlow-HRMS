
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import * as employeeService from "../../services/employeeService";
import * as attendanceService from "../../services/attendanceService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const initials = (text) => {
  const parts = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
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

const EmployeeList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [weekSummary, setWeekSummary] = useState(null);
  const [weekLoading, setWeekLoading] = useState(true);

  const remaining = (balance, key) => {
    const allocated = Number(balance?.[key]?.allocated) || 0;
    const used = Number(balance?.[key]?.used) || 0;
    return Math.max(0, allocated - used);
  };

  const weekRange = useMemo(() => {
    const start = startOfWeekMonday(weekStart);
    const end = addDays(start, 6);
    return { start, end, from: isoDateKey(start), to: isoDateKey(end) };
  }, [weekStart]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setWeekLoading(true);
      try {
        const data = await attendanceService.getWeeklySummary({ from: weekRange.from });
        if (!mounted) return;
        setWeekSummary(data || null);
      } catch {
        if (!mounted) return;
        setWeekSummary(null);
      } finally {
        if (!mounted) return;
        setWeekLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [weekRange.from]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await employeeService.listEmployees();
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
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return (rows || []).filter((e) => {
      const fullName = e?.personal?.fullName || "";
      const email = e?.user?.email || "";
      const empId = e?.user?.employeeId || "";
      return (
        fullName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        empId.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const chart = useMemo(() => {
    const days = Array.isArray(weekSummary?.days) ? weekSummary.days : [];
    const maxY = Math.max(1, Number(weekSummary?.totalEmployees) || 0);
    const w = 920;
    const h = 180;
    const padX = 20;
    const padY = 18;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;

    const xAt = (i) => padX + (innerW * (days.length <= 1 ? 0 : i / (days.length - 1)));
    const yAt = (val) => padY + (innerH - (innerH * Math.min(maxY, Math.max(0, val))) / maxY);

    const points = days.map((d, i) => {
      const yVal = Number(d?.present) || 0;
      return { x: xAt(i), y: yAt(yVal), date: String(d?.date || ""), value: yVal };
    });

    if (!points.length) {
      return { w, h, linePath: "", areaPath: "", points: [], maxY };
    }

    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${(padY + innerH).toFixed(2)} L${points[0].x.toFixed(2)},${(padY + innerH).toFixed(2)} Z`;

    return { w, h, linePath, areaPath, points, maxY };
  }, [weekSummary]);

  const goPrevWeek = () => {
    setWeekStart((d) => addDays(startOfWeekMonday(d), -7));
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-body">
          <div className="ui-row between gap-12" style={{ flexWrap: "wrap" }}>
            <div className="ui-h2">Employees</div>
            <input
              className="ui-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              style={{ width: 280 }}
            />
          </div>

          <Card className="pad" style={{ marginTop: 12, marginBottom: 12 }}>
            <div className="ui-row between" style={{ flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="ui-title">Weekly Attendance</div>
                <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                  {weekRange.from} - {weekRange.to}
                </div>
              </div>
              <Button variant="ghost" onClick={goPrevWeek} aria-label="Previous week">Prev</Button>
            </div>

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              {weekLoading ? (
                <div className="ui-small ui-muted">Loading...</div>
              ) : chart.points.length === 0 ? (
                <div className="ui-small ui-muted">No attendance data for this week.</div>
              ) : (
                <svg width={chart.w} height={chart.h} viewBox={`0 0 ${chart.w} ${chart.h}`} role="img" aria-label="Weekly attendance graph">
                  <defs>
                    <linearGradient id="att_fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111827" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <rect x="0" y="0" width={chart.w} height={chart.h} fill="#ffffff" />

                  <line x1="20" y1="18" x2="20" y2={chart.h - 18} stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="20" y1={chart.h - 18} x2={chart.w - 20} y2={chart.h - 18} stroke="#e5e7eb" strokeWidth="1" />

                  <path d={chart.areaPath} fill="url(#att_fill)" />
                  <path d={chart.linePath} fill="none" stroke="#111827" strokeWidth="2" />

                  {chart.points.map((p) => (
                    <g key={p.date}>
                      <circle cx={p.x} cy={p.y} r="3" fill="#111827" />
                      <text x={p.x} y={chart.h - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
                        {String(p.date || "").slice(5)}
                      </text>
                    </g>
                  ))}

                  <text x="6" y="26" fontSize="10" fill="#6b7280">{chart.maxY}</text>
                  <text x="6" y={chart.h - 18} fontSize="10" fill="#6b7280">0</text>
                </svg>
              )}
            </div>
          </Card>

          {error ? <div className="dash-note">{error}</div> : null}
          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="dash-grid">
              {filtered.map((e) => {
                const fullName = e?.personal?.fullName || "Employee";
                const email = e?.user?.email || "";
                const empId = e?.user?.employeeId || "";
                const pic = e?.personal?.profilePictureUrl || "";
                const stats = e?.leaveStats || {};
                const balance = e?.leaveBalance || e?.employee?.leaveBalance || null;
                const paidLeft = remaining(balance, "paid");
                const sickLeft = remaining(balance, "sick");

                return (
                  <div
                    key={e?._id || email}
                    className="dash-card"
                    onClick={() => navigate(`/admin/employees/${e?._id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dash-card-img">
                      {pic ? <img src={pic} alt="profile" /> : <span>{initials(fullName)}</span>}
                    </div>
                    <div>
                      <div className="dash-card-title">{fullName}</div>
                      <div className="dash-card-sub">{empId}</div>
                      <div className="dash-card-sub">{email}</div>
                      <div className="dash-card-sub">
                        Leaves • Approved: {stats?.approvedCount ?? 0} ({stats?.approvedDays ?? 0}d) • Pending: {stats?.pendingCount ?? 0} ({stats?.pendingDays ?? 0}d)
                      </div>
                      {balance ? (
                        <div className="dash-card-sub">
                          Balance • Paid: {paidLeft}d • Sick: {sickLeft}d
                        </div>
                      ) : null}
                    </div>
                    <div className="dash-dot present" />
                  </div>
                );
              })}

              {filtered.length === 0 ? <div className="dash-note">No employees found.</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
