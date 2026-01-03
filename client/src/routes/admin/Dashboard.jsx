
import React from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="dash-tab active">Admin</button>
          </div>
        </div>

        <div className="dash-body">
          <div className="dash-grid">
            <div className="dash-card" onClick={() => navigate("/admin/employees")} role="button" tabIndex={0}>
              <div>
                <div className="dash-card-title">Employees</div>
                <div className="dash-card-sub">View and manage employee profiles</div>
              </div>
              <div className="dash-dot present" />
            </div>

            <div className="dash-card" onClick={() => navigate("/admin/attendance")} role="button" tabIndex={0}>
              <div>
                <div className="dash-card-title">Attendance</div>
                <div className="dash-card-sub">Daily/weekly attendance records</div>
              </div>
              <div className="dash-dot present" />
            </div>

            <div className="dash-card" onClick={() => navigate("/admin/leaves")} role="button" tabIndex={0}>
              <div>
                <div className="dash-card-title">Leave Approvals</div>
                <div className="dash-card-sub">Approve or reject leave requests</div>
              </div>
              <div className="dash-dot present" />
            </div>

            <div className="dash-card" onClick={() => navigate("/admin/payroll")} role="button" tabIndex={0}>
              <div>
                <div className="dash-card-title">Payroll</div>
                <div className="dash-card-sub">View and update payroll entries</div>
              </div>
              <div className="dash-dot present" />
            </div>

            <div className="dash-card" onClick={() => navigate("/admin/reports")} role="button" tabIndex={0}>
              <div>
                <div className="dash-card-title">Analytics & Reports</div>
                <div className="dash-card-sub">Attendance reports and salary slips</div>
              </div>
              <div className="dash-dot present" />
            </div>
          </div>

          <div className="dash-note">
            Tip: You can also use the tabs in each section to switch between modules.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

