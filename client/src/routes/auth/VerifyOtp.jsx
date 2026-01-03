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

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp, loading } = useAuth();

  const initialEmail = location?.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const disabled = useMemo(() => {
    return loading || !email.trim() || otp.trim().length < 4;
  }, [loading, email, otp]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await verifyOtp({ email, otp });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const resend = async () => {
    setError("");
    setSuccess("");
    try {
      await resendOtp({ email });
      setSuccess("OTP sent. Check your email.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-panel">
          <h2 className="auth-title">Verify Email (OTP)</h2>
          <div className="auth-logo">
            <img src="/white.png" alt="Dayflow" style={{ height: 36 }} />
          </div>

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

            <button className="auth-btn" type="submit" disabled={disabled}>
              {loading ? "Verifying..." : "VERIFY"}
            </button>

            <button
              className="auth-btn"
              type="button"
              onClick={resend}
              disabled={loading || !email.trim()}
              style={{ marginTop: 10 }}
            >
              {loading ? "Sending..." : "RESEND OTP"}
            </button>
          </form>

          <div className="auth-footer">
            Back to <Link className="auth-link" to="/signin">Sign In</Link>
          </div>
        </div>

        <div className="auth-panel">
          <h2 className="auth-title">SMTP Setup</h2>
          <div className="auth-hint">
            Configure Gmail SMTP using a Google App Password.
            Set server env vars:
            SMTP_HOST=smtp.gmail.com
            SMTP_PORT=587
            SMTP_SECURE=false
            SMTP_USER=your_gmail
            SMTP_PASS=app_password
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
