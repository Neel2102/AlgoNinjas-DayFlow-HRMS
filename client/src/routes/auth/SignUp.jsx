import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuth } from "../../context/AuthContext";
import "../../CSS/Auth.css";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, loading, isAuthenticated } = useAuth();

  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [adminSecret, setAdminSecret] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const passwordMismatch = password && confirmPassword && password !== confirmPassword;

  const disabled = useMemo(() => {
    return (
      loading ||
      !employeeId.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      passwordMismatch
    );
  }, [loading, employeeId, email, password, confirmPassword, passwordMismatch]);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await signUp({ employeeId, email, password, role, adminSecret: role === "employee" ? "" : adminSecret });
      if (res?.verificationRequired) {
        navigate("/verify-otp", { replace: true, state: { email: res?.email || email } });
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-panel">
          <h2 className="auth-title">Sign Up Page</h2>
          <div className="auth-logo">App/Web Logo</div>

          {error ? <div className="auth-error">{error}</div> : null}

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-row">
              <label className="auth-label">Role :-</label>
              <select className="auth-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {role !== "employee" ? (
              <div className="auth-row">
                <label className="auth-label">Secret :-</label>
                <input
                  className="auth-input"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter HR/Admin secret"
                  autoComplete="off"
                />
              </div>
            ) : null}

            <div className="auth-row">
              <label className="auth-label">Employee Id :-</label>
              <input
                className="auth-input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP001"
                autoComplete="off"
              />
            </div>

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
              <label className="auth-label">Password :-</label>
              <div className="auth-password">
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-label">Confirm Password :-</label>
              <div className="auth-password">
                <input
                  className="auth-input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {passwordMismatch ? <div className="auth-error">Passwords do not match</div> : null}
            </div>

            <button className="auth-btn" type="submit" disabled={disabled}>
              {loading ? "Signing up..." : "SIGN UP"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link className="auth-link" to="/signin">Sign In</Link>
          </div>
        </div>

        <div className="auth-panel">
          <h2 className="auth-title">Note</h2>
          <div className="auth-hint">
            This Sign Up uses your existing backend requirements:
            employeeId + email + password.
            After signup, you are logged in automatically.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
