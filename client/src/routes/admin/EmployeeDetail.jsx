import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as employeeService from "../../services/employeeService";
import { toast } from "react-toastify";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const normalizeAddress = (address) => {
  if (!address) {
    return { line1: "", line2: "", city: "", state: "", country: "", postalCode: "" };
  }
  if (typeof address === "string") {
    return { line1: address, line2: "", city: "", state: "", country: "", postalCode: "" };
  }
  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    country: address.country || "",
    postalCode: address.postalCode || "",
  };
};

const defaultDoc = () => ({ name: "", category: "other", fileName: "", fileUrl: "" });

const EmployeeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [salary, setSalary] = useState({
    monthlyWage: "",
    yearlyWage: "",
    basic: 0,
    hra: 0,
    da: 0,
    specialAllowance: 0,
    transportAllowance: 0,
    medicalAllowance: 0,
    pf: 0,
    professionalTax: 0,
    incomeTax: 0,
    currency: "INR",
  });
  const [bank, setBank] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    accountType: "",
  });
  const [address, setAddress] = useState(normalizeAddress(null));
  const [documents, setDocuments] = useState([]);

  const totals = useMemo(() => {
    const s = salary || {};
    const earnings =
      (Number(s.basic) || 0) +
      (Number(s.hra) || 0) +
      (Number(s.da) || 0) +
      (Number(s.specialAllowance) || 0) +
      (Number(s.transportAllowance) || 0) +
      (Number(s.medicalAllowance) || 0);
    const deductions =
      (Number(s.pf) || 0) + (Number(s.professionalTax) || 0) + (Number(s.incomeTax) || 0);
    return {
      earnings,
      deductions,
      net: Math.max(0, earnings - deductions),
    };
  }, [salary]);

  const computedMonthlyWage = totals.earnings;
  const computedYearlyWage = totals.earnings * 12;

  const remaining = (balance, key) => {
    const allocated = Number(balance?.[key]?.allocated) || 0;
    const used = Number(balance?.[key]?.used) || 0;
    return Math.max(0, allocated - used);
  };

  const syncFormFromEmployee = (emp) => {
    const s = emp?.salary || {};
    setSalary({
      monthlyWage: s.monthlyWage ? s.monthlyWage : "",
      yearlyWage: s.yearlyWage ? s.yearlyWage : "",
      basic: s.basic ?? 0,
      hra: s.hra ?? 0,
      da: s.da ?? 0,
      specialAllowance: s.specialAllowance ?? 0,
      transportAllowance: s.transportAllowance ?? 0,
      medicalAllowance: s.medicalAllowance ?? 0,
      pf: s.pf ?? 0,
      professionalTax: s.professionalTax ?? 0,
      incomeTax: s.incomeTax ?? 0,
      currency: s.currency || "INR",
    });

    const b = emp?.bank || {};
    setBank({
      accountHolderName: b.accountHolderName || "",
      bankName: b.bankName || "",
      accountNumber: b.accountNumber || "",
      ifscCode: b.ifscCode || "",
      branch: b.branch || "",
      accountType: b.accountType || "",
    });

    setAddress(normalizeAddress(emp?.personal?.address));

    const docs = Array.isArray(emp?.documents) ? emp.documents : [];
    setDocuments(
      docs.map((d) => ({
        name: d?.name || "",
        category: d?.category || "other",
        fileName: d?.fileName || "",
        fileUrl: d?.fileUrl || d?.url || "",
      }))
    );
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await employeeService.getEmployeeById(id);
        if (!mounted) return;
        setEmployee(data);
        syncFormFromEmployee(data);
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    if (id) run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleEdit = () => {
    setSuccess("");
    setError("");
    setEditMode((v) => {
      const next = !v;
      if (!next && employee) {
        syncFormFromEmployee(employee);
      }
      return next;
    });
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        salary: {
          ...salary,
          monthlyWage: Number(computedMonthlyWage) || 0,
          yearlyWage: Number(computedYearlyWage) || 0,
          basic: Number(salary.basic) || 0,
          hra: Number(salary.hra) || 0,
          da: Number(salary.da) || 0,
          specialAllowance: Number(salary.specialAllowance) || 0,
          transportAllowance: Number(salary.transportAllowance) || 0,
          medicalAllowance: Number(salary.medicalAllowance) || 0,
          pf: Number(salary.pf) || 0,
          professionalTax: Number(salary.professionalTax) || 0,
          incomeTax: Number(salary.incomeTax) || 0,
          currency: String(salary.currency || "INR"),
        },
        bank: { ...bank },
        personal: {
          address: { ...address },
        },
        documents: (documents || [])
          .filter((d) => (d?.name || "").trim())
          .map((d) => ({
            name: String(d.name || "").trim(),
            category: String(d.category || "other").trim() || "other",
            fileName: String(d.fileName || "").trim(),
            fileUrl: String(d.fileUrl || "").trim(),
            url: String(d.fileUrl || "").trim(),
          })),
      };

      const updated = await employeeService.updateEmployeeById(id, payload);
      setEmployee(updated);
      syncFormFromEmployee(updated);
      setEditMode(false);
      setSuccess("Employee updated");
      toast.success("Employee updated");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateDoc = (idx, patch) => {
    setDocuments((prev) => {
      const next = prev.slice();
      next[idx] = { ...(next[idx] || defaultDoc()), ...patch };
      return next;
    });
  };

  const removeDoc = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-shell">
          <div className="dash-body">
            <div className="dash-note">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-page">
        <div className="dash-shell">
          <div className="dash-body">
            <div className="dash-note">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="dash-page">
        <div className="dash-shell">
          <div className="dash-body">
            <div className="dash-note">Employee not found.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/admin/employees")}>Back</button>
            <button className="dash-tab active">Employee</button>
          </div>

          <div className="dash-right">
            <button className="dash-action-btn secondary" onClick={toggleEdit} disabled={saving}>
              {editMode ? "Cancel" : "Edit"}
            </button>
            <button className="dash-action-btn" onClick={onSave} disabled={!editMode || saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="dash-body">
          {success ? <div className="dash-note">{success}</div> : null}

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                {employee?.personal?.fullName || "Employee"}
              </div>
              <div className="dash-card-sub" style={{ marginTop: 6 }}>
                {employee?.user?.employeeId || ""}
                {employee?.user?.email ? ` • ${employee.user.email}` : ""}
                {employee?.user?.role ? ` • ${employee.user.role}` : ""}
              </div>
            </div>
          </div>

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Leave Balance</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div className="dash-note" style={{ marginTop: 0 }}>
                  Paid: {remaining(employee?.leaveBalance, "paid")}d remaining
                  <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                    Used: {Number(employee?.leaveBalance?.paid?.used) || 0}d / Allocated: {Number(employee?.leaveBalance?.paid?.allocated) || 0}d
                  </div>
                </div>
                <div className="dash-note" style={{ marginTop: 0 }}>
                  Sick: {remaining(employee?.leaveBalance, "sick")}d remaining
                  <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                    Used: {Number(employee?.leaveBalance?.sick?.used) || 0}d / Allocated: {Number(employee?.leaveBalance?.sick?.allocated) || 0}d
                  </div>
                </div>
                <div className="dash-note" style={{ marginTop: 0 }}>
                  Pending: {employee?.leaveStats?.pendingCount ?? 0} requests ({employee?.leaveStats?.pendingDays ?? 0}d)
                  <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                    Approved: {employee?.leaveStats?.approvedCount ?? 0} ({employee?.leaveStats?.approvedDays ?? 0}d)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Address</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input className="dash-search" disabled={!editMode} value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="Line 1" />
                <input className="dash-search" disabled={!editMode} value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="Line 2" />
                <input className="dash-search" disabled={!editMode} value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="City" />
                <input className="dash-search" disabled={!editMode} value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} placeholder="State" />
                <input className="dash-search" disabled={!editMode} value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} placeholder="Country" />
                <input className="dash-search" disabled={!editMode} value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} placeholder="Postal Code" />
              </div>
            </div>
          </div>

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Salary Structure</div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, marginBottom: 10 }}>
                <input
                  className="dash-search"
                  type="number"
                  disabled
                  value={computedMonthlyWage ? computedMonthlyWage : ""}
                  placeholder="Monthly wage"
                />
                <input
                  className="dash-search"
                  type="number"
                  disabled
                  value={computedYearlyWage ? computedYearlyWage : ""}
                  placeholder="Yearly wage"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, marginBottom: 10 }}>
                <input
                  className="dash-search"
                  disabled={!editMode}
                  value={salary.currency}
                  onChange={(e) => setSalary((s) => ({ ...s, currency: e.target.value }))}
                  placeholder="Currency"
                />
                <div className="dash-note" style={{ marginTop: 0 }}>
                  Monthly earnings: {totals.earnings} • Monthly deductions: {totals.deductions} • Net: {totals.net}
                </div>
              </div>

              <div className="att-table-wrap" style={{ border: 0 }}>
                <table className="att-table" style={{ minWidth: 860 }}>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Type</th>
                      <th>Amount / month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td>Earning</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.basic} onChange={(e) => setSalary((s) => ({ ...s, basic: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>House Rent Allowance (HRA)</td>
                      <td>Earning</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.hra} onChange={(e) => setSalary((s) => ({ ...s, hra: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>Dearness Allowance (DA)</td>
                      <td>Earning</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.da} onChange={(e) => setSalary((s) => ({ ...s, da: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>Special Allowance</td>
                      <td>Earning</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.specialAllowance} onChange={(e) => setSalary((s) => ({ ...s, specialAllowance: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>Transport Allowance</td>
                      <td>Earning</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.transportAllowance} onChange={(e) => setSalary((s) => ({ ...s, transportAllowance: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>Medical Allowance</td>
                      <td>Earning</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.medicalAllowance} onChange={(e) => setSalary((s) => ({ ...s, medicalAllowance: e.target.value }))} />
                      </td>
                    </tr>

                    <tr>
                      <td>Provident Fund (PF)</td>
                      <td>Deduction</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.pf} onChange={(e) => setSalary((s) => ({ ...s, pf: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>Professional Tax</td>
                      <td>Deduction</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.professionalTax} onChange={(e) => setSalary((s) => ({ ...s, professionalTax: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <td>Income Tax</td>
                      <td>Deduction</td>
                      <td>
                        <input className="dash-search" type="number" disabled={!editMode} value={salary.incomeTax} onChange={(e) => setSalary((s) => ({ ...s, incomeTax: e.target.value }))} />
                      </td>
                    </tr>

                    <tr>
                      <td style={{ fontWeight: 900 }}>Total Earnings</td>
                      <td></td>
                      <td style={{ fontWeight: 900 }}>{totals.earnings}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 900 }}>Total Deductions</td>
                      <td></td>
                      <td style={{ fontWeight: 900 }}>{totals.deductions}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 900 }}>Net Pay</td>
                      <td></td>
                      <td style={{ fontWeight: 900 }}>{totals.net}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="att-table-wrap" style={{ marginBottom: 14 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Bank</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input className="dash-search" disabled={!editMode} value={bank.accountHolderName} onChange={(e) => setBank((b) => ({ ...b, accountHolderName: e.target.value }))} placeholder="Account Holder" />
                <input className="dash-search" disabled={!editMode} value={bank.bankName} onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))} placeholder="Bank Name" />
                <input className="dash-search" disabled={!editMode} value={bank.accountNumber} onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value }))} placeholder="Account Number" />
                <input className="dash-search" disabled={!editMode} value={bank.ifscCode} onChange={(e) => setBank((b) => ({ ...b, ifscCode: e.target.value }))} placeholder="IFSC" />
                <input className="dash-search" disabled={!editMode} value={bank.branch} onChange={(e) => setBank((b) => ({ ...b, branch: e.target.value }))} placeholder="Branch" />
                <input className="dash-search" disabled={!editMode} value={bank.accountType} onChange={(e) => setBank((b) => ({ ...b, accountType: e.target.value }))} placeholder="Account Type" />
              </div>
            </div>
          </div>

          <div className="att-table-wrap">
            <div style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>Documents</div>
                <button
                  className="dash-action-btn secondary"
                  type="button"
                  disabled={!editMode}
                  onClick={() => setDocuments((d) => [...(d || []), defaultDoc()])}
                >
                  Add document
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="dash-note" style={{ marginTop: 0 }}>No documents.</div>
              ) : (
                <div className="att-table-wrap" style={{ border: 0 }}>
                  <table className="att-table" style={{ minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>File Name</th>
                        <th>File URL</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((d, idx) => (
                        <tr key={idx}>
                          <td>
                            <input className="dash-search" disabled={!editMode} value={d.name} onChange={(e) => updateDoc(idx, { name: e.target.value })} />
                          </td>
                          <td>
                            <select className="dash-search" disabled={!editMode} value={d.category} onChange={(e) => updateDoc(idx, { category: e.target.value })}>
                              <option value="identity">identity</option>
                              <option value="education">education</option>
                              <option value="experience">experience</option>
                              <option value="other">other</option>
                            </select>
                          </td>
                          <td>
                            <input className="dash-search" disabled={!editMode} value={d.fileName} onChange={(e) => updateDoc(idx, { fileName: e.target.value })} />
                          </td>
                          <td>
                            <input className="dash-search" disabled={!editMode} value={d.fileUrl} onChange={(e) => updateDoc(idx, { fileUrl: e.target.value })} placeholder="https://..." />
                          </td>
                          <td>
                            <button className="dash-action-btn secondary" type="button" disabled={!editMode} onClick={() => removeDoc(idx)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;