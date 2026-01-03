import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import * as employeeService from "../../services/employeeService";
import * as attendanceService from "../../services/attendanceService";
import * as notificationService from "../../services/notificationService";
import { toast } from "react-toastify";
import "../../CSS/Employee.css";

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
  const [notifications, setNotifications] = useState([]);

  const [createEmployeeId, setCreateEmployeeId] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createEmailPrefix, setCreateEmailPrefix] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [createPersonalEmail, setCreatePersonalEmail] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState([]);

  const [alertTarget, setAlertTarget] = useState("all");
  const [alertSubject, setAlertSubject] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSending, setAlertSending] = useState(false);

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

          const inbox = await notificationService.getMyNotifications();
          if (!mounted) return;
          setNotifications(Array.isArray(inbox) ? inbox : []);
        }
      } catch (err) {
        if (!mounted) return;
        const msg = getErrorMessage(err);
        setError(msg);
        toast.error(msg);
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
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  const doCheckIn = async () => {
    setActionLoading(true);
    setError("");
    try {
      const record = await attendanceService.checkIn();
      setAttendanceToday(record);
      toast.success("Checked in");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
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
      toast.success("Checked out");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
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
      toast.success("Break started");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
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
      toast.success("Break ended");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
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
      ["Login ID", "Name", "Email", "Password"],
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
        fullName: createFullName,
        emailPrefix: createEmailPrefix,
        domain: createDomain,
        personalEmail: createPersonalEmail,
      };
      const res = await employeeService.createEmployeeUser(payload);
      const cred = res?.credentials;
      const employeeId = cred?.employeeId || res?.employee?.user?.employeeId || "";
      const email = cred?.email || "";
      const password = cred?.password || "";

      setCreatedCredentials((prev) => [
        {
          employeeId: String(employeeId || "").trim(),
          fullName: String(createFullName || "").trim(),
          email,
          password,
        },
        ...(prev || []),
      ]);

      const list = await employeeService.listEmployees();
      setEmployees(Array.isArray(list) ? list : []);

      setCreateFullName("");
      setCreateEmailPrefix("");
      setCreateDomain("");
      setCreatePersonalEmail("");

      toast.success("Employee created");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const markRead = async (id) => {
    setActionLoading(true);
    setError("");
    try {
      const updated = await notificationService.markRead(id);
      setNotifications((prev) => (prev || []).map((n) => (n?._id === updated?._id ? updated : n)));
      toast.success("Marked as read");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const sendAlert = async () => {
    const subject = String(alertSubject || "").trim();
    const message = String(alertMessage || "").trim();
    if (!subject || !message) {
      toast.error("Subject and message are required");
      return;
    }

    setAlertSending(true);
    setError("");
    try {
      if (alertTarget === "all") {
        await notificationService.broadcastAlert({
          subject,
          message,
          sendEmail: false,
          sendInApp: true,
        });
        toast.success("Alert sent to all employees");
      } else {
        await notificationService.alertUser(alertTarget, {
          subject,
          message,
          sendEmail: false,
          sendInApp: true,
        });
        toast.success("Alert sent");
      }
      setAlertSubject("");
      setAlertMessage("");
      setAlertTarget("all");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setAlertSending(false);
    }
  };

  return (
    <div className="container-employeedashboard">
      {/* Header */}
      <div className="header-employeedashboard">
        <div className="header-left-employeedashboard">
          <h1 className="title-employeedashboard">Dashboard</h1>
          <div className="subtitle-employeedashboard">
            {isAdmin ? "Manage employees, attendance, leave approvals and payroll" : "Your workday at a glance"}
          </div>
        </div>
        <div className="header-actions-employeedashboard">
          <Button className="btn-employeedashboard btn-ghost-employeedashboard" onClick={doLogout}>
            Log Out
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error ? (
        <div className="error-card-employeedashboard">
          <div className="error-text-employeedashboard">{error}</div>
        </div>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <div className="loading-card-employeedashboard">
          <div className="loading-text-employeedashboard">Loading...</div>
        </div>
      ) : isAdmin ? (
        <>
          <Card className="pad" style={{ marginBottom: 12 }}>
            <div className="ui-row between gap-12" style={{ flexWrap: "wrap" }}>
              <div>
                <div className="ui-title">Send Alert</div>
                <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                  Send an in-app alert to all employees or a specific employee.
                </div>
              </div>
            </div>

            <div
              className="ui-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
                marginTop: 12,
              }}
            >
              <select
                className="dash-search"
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
              >
                <option value="all">All employees</option>
                {(employees || []).map((e) => {
                  const uid = e?.user?._id || e?.user?.id || "";
                  const name = String(e?.personal?.fullName || "").trim();
                  const empId = String(e?.user?.employeeId || "").trim();
                  if (!uid) return null;
                  const label = name ? `${name}${empId ? ` (${empId})` : ""}` : (empId || "Employee");
                  return (
                    <option key={uid} value={uid}>
                      {label}
                    </option>
                  );
                })}
              </select>

              <input
                className="dash-search"
                value={alertSubject}
                onChange={(e) => setAlertSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <textarea
                className="dash-search"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Message"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <div className="ui-row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
              <Button onClick={sendAlert} disabled={alertSending || actionLoading}>
                {alertSending ? "Sending..." : "Send Alert"}
              </Button>
            </div>
          </Card>

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
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
                placeholder="Full Name"
              />
              <input
                className="dash-search"
                value={createPersonalEmail}
                onChange={(e) => setCreatePersonalEmail(e.target.value)}
                placeholder="Personal email (for alerts)"
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
                disabled={actionLoading || !String(createFullName).trim() || !String(createDomain).trim()}
              >
                {actionLoading ? "Creating..." : "Create Employee"}
              </Button>
            </div>

            {createdCredentials.length ? (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table className="dash-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Login ID</th>
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
                <div className="section-title-employeedashboard">Employees</div>
                <div className="section-desc-employeedashboard">
                  Click a card to view the employee profile
                </div>
              </div>
              <div className="section-actions-employeedashboard">
                <Button
                  className="btn-employeedashboard btn-ghost-employeedashboard"
                  onClick={() => navigate("/admin/attendance")}
                >
                  Attendance
                </Button>
                <Button
                  className="btn-employeedashboard btn-ghost-employeedashboard"
                  onClick={() => navigate("/admin/leaves")}
                >
                  Leave Approvals
                </Button>
                <Button
                  className="btn-employeedashboard btn-ghost-employeedashboard"
                  onClick={() => navigate("/admin/payroll")}
                >
                  Payroll
                </Button>
              </div>
            </div>
          </Card>

          {/* Employee Grid */}
          <div className="employee-grid-employeedashboard">
            {filteredEmployees.map((e) => {
              const fullName = String(e?.personal?.fullName || "").trim();
              if (!fullName) return null;
              const email = e?.user?.email || "";
              const empId = e?.user?.employeeId || "";
              const pic = e?.personal?.profilePictureUrl || "";
              const dot = dotClassFromStatus(null);
              const userId = e?.user?._id || e?.user?.id || "";
              return (
                <Card
                  key={e?._id || email}
                  className="employee-card-employeedashboard"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/employees/${e?._id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") navigate(`/admin/employees/${e?._id}`);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="employee-content-employeedashboard">
                    <div className="employee-left-employeedashboard">
                      <div className="employee-avatar-employeedashboard">
                        {pic ? <img src={pic} alt="profile" /> : initials(fullName)}
                      </div>
                      <div className="employee-info-employeedashboard">
                        <div className="employee-name-employeedashboard">{fullName}</div>
                        <div className="employee-id-employeedashboard">{empId || email}</div>
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
          <Card className="pad" style={{ marginBottom: 12 }}>
            <div className="ui-title">My Alerts</div>
            <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
              Latest notifications from Admin/HR.
            </div>

            {!notifications.length ? (
              <div className="ui-small ui-muted" style={{ marginTop: 10 }}>No alerts yet.</div>
            ) : (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {notifications.slice(0, 8).map((n) => {
                  const unread = !n?.readAt;
                  return (
                    <div
                      key={n?._id}
                      style={{
                        border: "1px solid var(--border-medium)",
                        borderRadius: 12,
                        padding: 12,
                        background: "var(--bg-secondary)",
                      }}
                    >
                      <div className="ui-row between gap-12">
                        <div style={{ fontWeight: 900 }}>{n?.title || "Alert"}</div>
                        {unread ? (
                          <Button variant="ghost" onClick={() => markRead(n._id)} disabled={actionLoading}>
                            Mark read
                          </Button>
                        ) : (
                          <div className="ui-small ui-muted">Read</div>
                        )}
                      </div>
                      <div className="ui-small" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                        {n?.message || ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

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

          {/* Attendance Card */}
          <div className="attendance-card-employeedashboard">
            <div className="attendance-header-employeedashboard">
              <div className="attendance-info-employeedashboard">
                <div className="attendance-title-employeedashboard">Today's Attendance</div>
                <div className="attendance-user-employeedashboard">
                  {me?.personal?.fullName || user?.email}
                </div>
              </div>
              <div className="attendance-buttons-employeedashboard">
                <Button
                  className="btn-employeedashboard btn-primary-employeedashboard"
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

            <div className="divider-employeedashboard" />

            <div className="attendance-details-employeedashboard">
              <div className="attendance-item-employeedashboard">
                <span className="attendance-label-employeedashboard">Date:</span>
                <span className="attendance-value-employeedashboard">
                  {attendanceToday?.date || new Date().toISOString().slice(0, 10)}
                </span>
              </div>
              <div className="attendance-item-employeedashboard">
                <span className="attendance-label-employeedashboard">Status:</span>
                <span className="attendance-value-employeedashboard">
                  {attendanceToday?.status || "Absent"}
                </span>
              </div>
              <div className="attendance-item-employeedashboard">
                <span className="attendance-label-employeedashboard">Check In:</span>
                <span className="attendance-value-employeedashboard">
                  {attendanceToday?.checkInAt
                    ? new Date(attendanceToday.checkInAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <div className="attendance-item-employeedashboard">
                <span className="attendance-label-employeedashboard">Check Out:</span>
                <span className="attendance-value-employeedashboard">
                  {attendanceToday?.checkOutAt
                    ? new Date(attendanceToday.checkOutAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Payroll Card */}
          <div className="payroll-card-employeedashboard">
            <div className="payroll-header-employeedashboard">
              <div className="payroll-info-employeedashboard">
                <div className="payroll-title-employeedashboard">Payroll</div>
                <div className="payroll-desc-employeedashboard">
                  View salary details (read-only)
                </div>
              </div>
              <button
                className="btn-employeedashboard btn-ghost-employeedashboard"
                onClick={() => navigate("/payroll")}
              >
                Open Payroll
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;