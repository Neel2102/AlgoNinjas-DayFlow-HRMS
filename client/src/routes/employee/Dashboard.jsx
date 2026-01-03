import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import * as employeeService from "../../services/employeeService";
import * as attendanceService from "../../services/attendanceService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const dotClassFromStatus = (status) => {
  if (!status) return "present";
  const s = String(status).toLowerCase();
  if (s.includes("absent")) return "absent";
  if (s.includes("leave")) return "leave";
  if (s.includes("half")) return "half";
  return "present";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { shellSearch } = useOutletContext() || {};
  const { user, signOut } = useAuth();

  const role = user?.role || "employee";
  const isAdmin = role === "admin" || role === "hr";

  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [createEmployeeId, setCreateEmployeeId] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createEmailPrefix, setCreateEmailPrefix] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const myProfile = await employeeService.getMyProfile();
        if (!mounted) return;
        setMe(myProfile);

        if (isAdmin) {
          const list = await employeeService.listEmployees();
          if (!mounted) return;
          setEmployees(Array.isArray(list) ? list : []);
        } else {
          const rows = await attendanceService.getMyAttendance();
          if (!mounted) return;
          const todayKey = new Date().toISOString().slice(0, 10);
          const today = Array.isArray(rows) ? rows.find((r) => r?.date === todayKey) : null;
          setAttendanceToday(today || null);
        }
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
  }, [isAdmin]);

  const filteredEmployees = useMemo(() => {
    const q = String(shellSearch || "").trim().toLowerCase();
    if (!q) return employees;
    return (employees || []).filter((e) => {
      const fullName = e?.personal?.fullName || "";
      const email = e?.user?.email || "";
      const empId = e?.user?.employeeId || "";
      return (
        fullName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        empId.toLowerCase().includes(q)
      );
    });
  }, [employees, shellSearch]);

  const doLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const doCheckIn = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.checkIn();
      setAttendanceToday(record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const doCheckOut = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.checkOut();
      setAttendanceToday(record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const csvEscape = (val) => {
    const s = String(val ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadCsv = () => {
    const rows = [
      ["Employee ID", "Name", "Email", "Password"],
      ...(createdCredentials || []).map((r) => [r.employeeId, r.fullName, r.email, r.password]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dayflow_employees_credentials.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const doCreateEmployee = async () => {
    setActionLoading(true);
    setError("");
    try {
      const payload = {
        employeeId: createEmployeeId,
        fullName: createFullName,
        emailPrefix: createEmailPrefix,
        domain: createDomain,
      };
      const res = await employeeService.createEmployeeUser(payload);
      const cred = res?.credentials;
      const email = cred?.email || "";
      const password = cred?.password || "";

      setCreatedCredentials((prev) => [
        {
          employeeId: String(createEmployeeId || "").trim(),
          fullName: String(createFullName || "").trim(),
          email,
          password,
        },
        ...(prev || []),
      ]);

      const list = await employeeService.listEmployees();
      setEmployees(Array.isArray(list) ? list : []);

      setCreateEmployeeId("");
      setCreateFullName("");
      setCreateEmailPrefix("");
      setCreateDomain("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const doBreakStart = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.breakStart();
      setAttendanceToday(record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const doBreakEnd = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.breakEnd();
      setAttendanceToday(record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="ui-h1">Dashboard</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
            {isAdmin ? "Manage employees, attendance, time off and payroll" : "Your workday at a glance"}
          </div>
        </div>
        <div className="ui-row gap-10">
          {!isAdmin ? (
            <Button variant="ghost" onClick={doLogout}>Log Out</Button>
          ) : (
            <Button variant="ghost" onClick={doLogout}>Log Out</Button>
          )}
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="pad">
          <div className="ui-small ui-muted">Loading...</div>
        </Card>
      ) : isAdmin ? (
        <>
          <Card className="pad" style={{ marginBottom: 12 }}>
            <div className="ui-row between gap-12" style={{ flexWrap: "wrap" }}>
              <div>
                <div className="ui-title">Create Employee</div>
                <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                  This generates an organization email and a one-time password for the employee.
                </div>
              </div>
              <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
                <Button
                  variant="ghost"
                  onClick={downloadCsv}
                  disabled={!createdCredentials.length}
                >
                  Download Excel (CSV)
                </Button>
              </div>
            </div>

            <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
              <input
                className="dash-search"
                value={createEmployeeId}
                onChange={(e) => setCreateEmployeeId(e.target.value)}
                placeholder="Employee ID (e.g. EMP010)"
              />
              <input
                className="dash-search"
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
                placeholder="Full Name (optional)"
              />
              <input
                className="dash-search"
                value={createEmailPrefix}
                onChange={(e) => setCreateEmailPrefix(e.target.value)}
                placeholder="Email prefix (e.g. john.doe)"
              />
              <input
                className="dash-search"
                value={createDomain}
                onChange={(e) => setCreateDomain(e.target.value)}
                placeholder="Domain (e.g. dayflow.com)"
              />
            </div>

            <div className="ui-row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
              <Button
                onClick={doCreateEmployee}
                disabled={actionLoading || !String(createEmployeeId).trim() || !String(createDomain).trim()}
              >
                {actionLoading ? "Creating..." : "Create Employee"}
              </Button>
            </div>

            {createdCredentials.length ? (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table className="dash-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Email</th>
                      <th>Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdCredentials.map((r, idx) => (
                      <tr key={`${r.email}-${idx}`}>
                        <td>{r.employeeId}</td>
                        <td>{r.email}</td>
                        <td>{r.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ui-small ui-muted" style={{ marginTop: 8 }}>
                  Passwords are shown only for employees created in this session.
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="pad" style={{ marginBottom: 12 }}>
            <div className="ui-row between gap-12" style={{ flexWrap: "wrap" }}>
              <div>
                <div className="ui-title">Employees</div>
                <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                  Click a card to view the employee profile
                </div>
              </div>
              <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={() => navigate("/admin/attendance")}>Attendance</Button>
                <Button variant="ghost" onClick={() => navigate("/admin/leaves")}>Time Off</Button>
                <Button variant="ghost" onClick={() => navigate("/admin/payroll")}>Payroll</Button>
              </div>
            </div>
          </Card>

          <div className="ui-grid cards">
            {filteredEmployees.map((e) => {
              const fullName = e?.personal?.fullName || "Employee";
              const email = e?.user?.email || "";
              const empId = e?.user?.employeeId || "";
              const pic = e?.personal?.profilePictureUrl || "";
              const dot = dotClassFromStatus(null);
              return (
                <Card
                  key={e?._id || email}
                  className="pad"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/employees/${e?._id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") navigate(`/admin/employees/${e?._id}`);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="ui-row between gap-12">
                    <div className="ui-row gap-12">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          border: "1px solid var(--border-medium)",
                          background: "var(--bg-primary)",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                        }}
                      >
                        {pic ? <img src={pic} alt="profile" style={{ width: "100%", height: "100%", borderRadius: 999, objectFit: "cover" }} /> : initials(fullName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900 }}>{fullName}</div>
                        <div className="ui-small ui-muted" style={{ marginTop: 2 }}>{empId || email}</div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        border: "1px solid var(--border-medium)",
                        background: dot === "present" ? "var(--secondary)" : "var(--border-dark)",
                      }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="ui-grid cards" style={{ marginBottom: 12 }}>
            <Card className="pad" role="button" tabIndex={0} onClick={() => navigate("/profile")}
              onKeyDown={(e) => { if (e.key === "Enter") navigate("/profile"); }} style={{ cursor: "pointer" }}>
              <div className="ui-title">Profile</div>
              <div className="ui-small ui-muted" style={{ marginTop: 6 }}>View and edit your details</div>
            </Card>
            <Card className="pad" role="button" tabIndex={0} onClick={() => navigate("/attendance")}
              onKeyDown={(e) => { if (e.key === "Enter") navigate("/attendance"); }} style={{ cursor: "pointer" }}>
              <div className="ui-title">Attendance</div>
              <div className="ui-small ui-muted" style={{ marginTop: 6 }}>Daily / weekly view</div>
            </Card>
            <Card className="pad" role="button" tabIndex={0} onClick={() => navigate("/leaves")}
              onKeyDown={(e) => { if (e.key === "Enter") navigate("/leaves"); }} style={{ cursor: "pointer" }}>
              <div className="ui-title">Time Off</div>
              <div className="ui-small ui-muted" style={{ marginTop: 6 }}>Apply and track requests</div>
            </Card>
            <Card className="pad" role="button" tabIndex={0} onClick={doLogout}
              onKeyDown={(e) => { if (e.key === "Enter") doLogout(); }} style={{ cursor: "pointer" }}>
              <div className="ui-title">Logout</div>
              <div className="ui-small ui-muted" style={{ marginTop: 6 }}>Sign out of your account</div>
            </Card>
          </div>

          <Card className="pad" style={{ marginBottom: 12 }}>
            <div className="ui-row between" style={{ marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="ui-title">Today’s Attendance</div>
                <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                  {me?.personal?.fullName || user?.email}
                </div>
              </div>
              <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  onClick={doCheckIn}
                  disabled={actionLoading || Boolean(attendanceToday?.checkInAt)}
                >
                  {attendanceToday?.checkInAt ? "Checked In" : "Check In"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={doBreakStart}
                  disabled={
                    actionLoading ||
                    !attendanceToday?.checkInAt ||
                    Boolean(attendanceToday?.checkOutAt) ||
                    Boolean(attendanceToday?.breakStartAt)
                  }
                >
                  Start Break
                </Button>
                <Button
                  variant="ghost"
                  onClick={doBreakEnd}
                  disabled={
                    actionLoading ||
                    !attendanceToday?.checkInAt ||
                    Boolean(attendanceToday?.checkOutAt) ||
                    !Boolean(attendanceToday?.breakStartAt)
                  }
                >
                  End Break
                </Button>
                <Button
                  variant="ghost"
                  onClick={doCheckOut}
                  disabled={actionLoading || !attendanceToday?.checkInAt || Boolean(attendanceToday?.checkOutAt)}
                >
                  {attendanceToday?.checkOutAt ? "Checked Out" : "Check Out"}
                </Button>
              </div>
            </div>
            <div className="ui-divider" style={{ margin: "10px 0" }} />
            <div className="ui-row gap-12" style={{ flexWrap: "wrap" }}>
              <div className="ui-small"><span className="ui-muted">Date:</span> {attendanceToday?.date || new Date().toISOString().slice(0, 10)}</div>
              <div className="ui-small"><span className="ui-muted">Status:</span> {attendanceToday?.status || "—"}</div>
              <div className="ui-small"><span className="ui-muted">Check In:</span> {attendanceToday?.checkInAt ? new Date(attendanceToday.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
              <div className="ui-small"><span className="ui-muted">Check Out:</span> {attendanceToday?.checkOutAt ? new Date(attendanceToday.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
            </div>
          </Card>

          <Card className="pad">
            <div className="ui-row between" style={{ flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="ui-title">Payroll</div>
                <div className="ui-small ui-muted" style={{ marginTop: 6 }}>View salary details (read-only)</div>
              </div>
              <Button variant="ghost" onClick={() => navigate("/payroll")}>Open Payroll</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
