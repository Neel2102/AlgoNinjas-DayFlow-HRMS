import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import * as employeeService from "../../services/employeeService";
import * as leaveService from "../../services/leaveService";
import { toast } from "react-toastify";

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

const LeaveApproval = () => {
  const { shellSearch } = useOutletContext() || {};

  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState({ open: false, id: "", action: "", comment: "" });
  const [details, setDetails] = useState({ open: false, row: null });

  const [activeTab, setActiveTab] = useState("timeoff");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await leaveService.listLeaves({ status: status || undefined, userId: selectedUserId || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, status]);

  const employeeOptions = useMemo(() => {
    return (employees || []).map((e) => ({
      id: e?.user?._id,
      label: `${e?.user?.employeeId || ""} ${e?.personal?.fullName ? `- ${e.personal.fullName}` : ""}`.trim(),
    })).filter((x) => x.id);
  }, [employees]);

  const openDecision = ({ id, action }) => {
    setError("");
    setDecision({ open: true, id, action, comment: "" });
  };

  const openDetails = (row) => {
    setError("");
    setDetails({ open: true, row: row || null });
  };

  const closeDetails = () => setDetails({ open: false, row: null });

  const remaining = (balance, key) => {
    const allocated = Number(balance?.[key]?.allocated) || 0;
    const used = Number(balance?.[key]?.used) || 0;
    return Math.max(0, allocated - used);
  };

  const submitDecision = async () => {
    const { id, action, comment } = decision || {};
    if (!id || !action) return;
    setError("");
    try {
      if (action === "approve") {
        await leaveService.approveLeave({ id, comment });
      } else {
        await leaveService.rejectLeave({ id, comment });
      }
      setDecision({ open: false, id: "", action: "", comment: "" });
      toast.success(action === "approve" ? "Leave approved" : "Leave rejected");
      await load();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  const filteredRows = useMemo(() => {
    const q = String(shellSearch || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const emp = String(r?.user?.employeeId || "").toLowerCase();
      const email = String(r?.user?.email || "").toLowerCase();
      const type = String(r?.type || "").toLowerCase();
      const statusText = String(r?.status || "").toLowerCase();
      return emp.includes(q) || email.includes(q) || type.includes(q) || statusText.includes(q);
    });
  }, [rows, shellSearch]);

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">Leave Approvals</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>Admin / HR approvals</div>
        </div>

        <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
          <div className="ui-row gap-8">
            <Button variant={activeTab === "timeoff" ? "primary" : "ghost"} onClick={() => setActiveTab("timeoff")}>Requests</Button>
            <Button variant={activeTab === "allocation" ? "primary" : "ghost"} onClick={() => setActiveTab("allocation")}>Allocation</Button>
          </div>

          <select className="ui-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ width: 300 }}>
            <option value="">All employees</option>
            {employeeOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>

          <select className="ui-input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 180 }}>
            <option value="">All status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      {activeTab === "allocation" ? (
        <div className="ui-grid cards">
          <Card className="pad">
            <div className="ui-title">Allocation (Coming Next)</div>
            <div className="ui-divider" style={{ margin: "10px 0" }} />
            <div className="ui-small ui-muted" style={{ lineHeight: 1.6 }}>
              Allocation management requires backend support (per-user balances). Requests and approvals are fully working now.
            </div>
          </Card>
          <Card className="pad">
            <div className="ui-title">Note</div>
            <div className="ui-divider" style={{ margin: "10px 0" }} />
            <div className="ui-small ui-muted" style={{ lineHeight: 1.6 }}>
              Employees can view only their own leave records. Admins and HR officers can view and approve/reject requests for all employees.
            </div>
          </Card>
        </div>
      ) : (
        <>
          <Modal
            title="Leave Request Details"
            open={Boolean(details?.open)}
            onClose={closeDetails}
          >
            {(() => {
              const r = details?.row;
              if (!r) return null;
              const emp = r?.employee || null;
              const balance = emp?.leaveBalance || null;
              const type = String(r?.type || "");
              const days = Number(r?.days) || 0;
              const start = r?.startDate ? isoDateKey(r.startDate) : "";
              const end = r?.endDate ? isoDateKey(r.endDate) : "";
              const pending = r?.status === "Pending";
              const paidLeft = remaining(balance, "paid");
              const sickLeft = remaining(balance, "sick");

              return (
                <div style={{ display: "grid", gap: 12 }}>
                  <div className="ui-row" style={{ gap: 12, alignItems: "center" }}>
                    <div className="ui-avatar" style={{ width: 44, height: 44 }}>
                      {emp?.profilePictureUrl ? (
                        <img
                          src={emp.profilePictureUrl}
                          alt="profile"
                          style={{ width: "100%", height: "100%", borderRadius: 999, objectFit: "cover" }}
                        />
                      ) : (
                        String(emp?.fullName || r?.employeeName || r?.user?.employeeId || "U").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontWeight: 900 }}>{emp?.fullName || r?.employeeName || ""}</div>
                      <div className="ui-small ui-muted">{r?.user?.employeeId || ""} {r?.user?.email ? `• ${r.user.email}` : ""}</div>
                    </div>
                  </div>

                  <div className="ui-divider" />

                  <div className="ui-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    <div>
                      <div className="ui-small ui-muted">Type</div>
                      <div style={{ fontWeight: 800 }}>{type}</div>
                    </div>
                    <div>
                      <div className="ui-small ui-muted">Status</div>
                      <div style={{ fontWeight: 800 }}>{r?.status || ""}</div>
                    </div>
                    <div>
                      <div className="ui-small ui-muted">Start</div>
                      <div style={{ fontWeight: 800 }}>{start}</div>
                    </div>
                    <div>
                      <div className="ui-small ui-muted">End</div>
                      <div style={{ fontWeight: 800 }}>{end}</div>
                    </div>
                    <div>
                      <div className="ui-small ui-muted">Days</div>
                      <div style={{ fontWeight: 800 }}>{days || ""}</div>
                    </div>
                    <div>
                      <div className="ui-small ui-muted">Remaining balance</div>
                      <div style={{ fontWeight: 800 }}>Paid: {paidLeft}d • Sick: {sickLeft}d</div>
                    </div>
                  </div>

                  {r?.remarks ? (
                    <div>
                      <div className="ui-small ui-muted">Remarks</div>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{r.remarks}</div>
                    </div>
                  ) : null}

                  {r?.attachmentUrl ? (
                    <div>
                      <div className="ui-small ui-muted">Attachment</div>
                      <div style={{ marginTop: 6, display: "grid", gap: 8 }}>
                        <a href={r.attachmentUrl} target="_blank" rel="noreferrer">{r?.attachmentName || "Open attachment"}</a>
                        {String(r.attachmentUrl).match(/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i) ? (
                          <img src={r.attachmentUrl} alt="attachment" style={{ width: "100%", borderRadius: 12 }} />
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {pending ? (
                    <div className="ui-row between" style={{ gap: 10 }}>
                      <Button variant="ghost" onClick={closeDetails}>Close</Button>
                      <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
                        <Button variant="danger" onClick={() => { closeDetails(); openDecision({ id: r?._id, action: "reject" }); }}>Reject</Button>
                        <Button variant="success" onClick={() => { closeDetails(); openDecision({ id: r?._id, action: "approve" }); }}>Approve</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="ui-row" style={{ justifyContent: "flex-end" }}>
                      <Button variant="ghost" onClick={closeDetails}>Close</Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </Modal>

          <Modal
            title={decision?.action === "approve" ? "Approve Leave" : "Reject Leave"}
            open={Boolean(decision?.open)}
            onClose={() => setDecision({ open: false, id: "", action: "", comment: "" })}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div className="ui-small ui-muted">Comment (optional)</div>
                <input
                  className="ui-input"
                  value={decision?.comment || ""}
                  onChange={(e) => setDecision((s) => ({ ...(s || {}), comment: e.target.value }))}
                  placeholder="Add a note"
                />
              </div>
              <div className="ui-row between" style={{ gap: 10 }}>
                <Button variant="ghost" onClick={() => setDecision({ open: false, id: "", action: "", comment: "" })}>Cancel</Button>
                <Button
                  variant={decision?.action === "approve" ? "success" : "danger"}
                  onClick={submitDecision}
                >
                  {decision?.action === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          </Modal>

          <Card className="pad" padded={false}>
          {loading ? (
            <div className="pad" style={{ padding: 16 }}>
              <div className="ui-small ui-muted">Loading...</div>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Leave Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No leave requests found.</td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
                    const pending = r?.status === "Pending";
                    const id = r?._id;
                    return (
                      <tr key={id}>
                        <td>{r?.employeeName || r?.user?.employeeId || ""}</td>
                        <td>{r?.startDate ? isoDateKey(r.startDate) : ""}</td>
                        <td>{r?.endDate ? isoDateKey(r.endDate) : ""}</td>
                        <td>{r?.type || ""}</td>
                        <td>{r?.status || ""}</td>
                        <td>
                          <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
                            <Button variant="ghost" onClick={() => openDetails(r)} style={{ height: 34, padding: "0 12px", borderRadius: 10 }}>
                              View
                            </Button>
                            {pending ? (
                              <>
                                <Button variant="danger" onClick={() => openDecision({ id, action: "reject" })} style={{ height: 34, padding: "0 12px", borderRadius: 10 }}>
                                  Reject
                                </Button>
                                <Button variant="success" onClick={() => openDecision({ id, action: "approve" })} style={{ height: 34, padding: "0 12px", borderRadius: 10 }}>
                                  Approve
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
          </Card>
        </>
      )}
    </div>
  );
};

export default LeaveApproval;

