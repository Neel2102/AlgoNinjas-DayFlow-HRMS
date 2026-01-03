import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";
import "../../CSS/Auth.css";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const disabled = useMemo(() => {
    return loading || !email.trim();
  }, [loading, email]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await forgotPassword({ email });
      setSuccess("If this email exists, an OTP was sent.");
      toast.success("OTP sent (if the email exists)");
      navigate("/reset-password", { replace: true, state: { email } });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-panel">
          <h2 className="auth-title">Forgot Password</h2>
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

            <button className="auth-btn" type="submit" disabled={disabled}>
              {loading ? "Sending..." : "SEND OTP"}
            </button>
          </form>

          <div className="auth-footer">
            Back to <Link className="auth-link" to="/signin">Sign In</Link>
          </div>
        </div>

        <div className="auth-panel">
          <h2 className="auth-title">Note</h2>
          <div className="auth-hint">
            Enter your registered email. We will send a one-time password (OTP)
            to reset your password.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
