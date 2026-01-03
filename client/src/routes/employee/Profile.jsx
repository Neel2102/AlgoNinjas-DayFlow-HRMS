import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../CSS/Dashboard.css";
import * as employeeService from "../../services/employeeService";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await employeeService.getMyProfile();
        if (!mounted) return;
        setMe(res);
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

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-tabs">
            <button className="dash-tab active" onClick={() => navigate("/profile")}>My Profile</button>
          </div>
          <div className="dash-right">
            <button className="dash-tab" onClick={() => navigate("/dashboard")}>Back</button>
          </div>
        </div>

        <div className="dash-body">
          {error ? <div className="dash-note">{error}</div> : null}
          {loading ? (
            <div className="dash-note">Loading...</div>
          ) : (
            <div className="dash-note">
              Full Name: {me?.personal?.fullName || ""}
              <br />
              Email: {me?.user?.email || ""}
              <br />
              Employee ID: {me?.user?.employeeId || ""}
              <br />
              Role: {me?.user?.role || ""}
              <br />
              Phone: {me?.personal?.phone || ""}
              <br />
              Address: {me?.personal?.address || ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
