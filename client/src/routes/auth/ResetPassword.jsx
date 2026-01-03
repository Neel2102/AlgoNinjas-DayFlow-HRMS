import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "../../CSS/Auth.css";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, loading } = useAuth();

  const initialEmail = location?.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  const disabled = useMemo(() => {
    return (
      loading ||
      !email.trim() ||
      otp.trim().length < 4 ||
      !newPassword ||
      !confirmPassword ||
      mismatch
    );
  }, [loading, email, otp, newPassword, confirmPassword, mismatch]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await resetPassword({ email, otp, newPassword });
      setSuccess("Password reset successful. Please sign in.");
      navigate("/signin", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-panel">
          <h2 className="auth-title">Reset Password (OTP)</h2>
          <div className="auth-logo">Dayflow HRMS</div>

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-error">{success}</div> : null}

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-row">
              <label className="auth-label">Email :-</label>
              <input
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-row">
              <label className="auth-label">OTP :-</label>
              <input
                className="auth-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                autoComplete="one-time-code"
              />
            </div>

            <div className="auth-row">
              <label className="auth-label">New Password :-</label>
              <div className="auth-password">
                <input
                  className="auth-input"
                  type={show ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button type="button" className="auth-toggle" onClick={() => setShow((s) => !s)}>
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-label">Confirm Password :-</label>
              <input
                className="auth-input"
                type={show ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {mismatch ? <div className="auth-error">Passwords do not match</div> : null}
            </div>

            <button className="auth-btn" type="submit" disabled={disabled}>
              {loading ? "Resetting..." : "RESET PASSWORD"}
            </button>
          </form>

          <div className="auth-footer">
            Back to <Link className="auth-link" to="/signin">Sign In</Link>
          </div>
        </div>

        <div className="auth-panel">
          <h2 className="auth-title">Tip</h2>
          <div className="auth-hint">
            Use the OTP received on your email and set a new password.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
