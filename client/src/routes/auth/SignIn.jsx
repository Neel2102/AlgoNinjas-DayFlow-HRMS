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

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn, loading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const disabled = useMemo(() => {
    return loading || !email.trim() || !password;
  }, [loading, email, password]);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signIn({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-panel">
          <h2 className="auth-title">Sign in Page</h2>
          <div className="auth-logo">App/Web Logo</div>

          {error ? <div className="auth-error">{error}</div> : null}

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-row">
              <label className="auth-label">Login Id/Email :-</label>
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
                  autoComplete="current-password"
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

            <button className="auth-btn" type="submit" disabled={disabled}>
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: 10 }}>
            <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
          </div>

          <div className="auth-footer">
            Don&apos;t have an account? <Link className="auth-link" to="/signup">Sign Up</Link>
          </div>
        </div>

        <div className="auth-panel">
          <h2 className="auth-title">Note</h2>
          <div className="auth-hint">
            Normal user cannot register in real setups; HR/Admin creates employees.
            For hackathon demo, you can sign up here using the backend endpoint.
            After login, a JWT is stored locally and sent as a Bearer token.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
