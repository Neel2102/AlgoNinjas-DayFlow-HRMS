import api from "./api";

const unwrap = (res) => {
  if (res && res.data && typeof res.data === "object") return res.data;
  return res;
};

export const signIn = async ({ email, password }) => {
  const res = await api.post("/auth/signin", { email, password });
  return unwrap(res);
};

export const signUp = async ({ employeeId, email, password, role, adminSecret }) => {
  const payload = { employeeId, email, password };
  if (role) payload.role = role;
  if (adminSecret) payload.adminSecret = adminSecret;
  const res = await api.post("/auth/signup", payload);
  return unwrap(res);
};

export const verifyOtp = async ({ email, otp }) => {
  const res = await api.post("/auth/verify-otp", { email, otp });
  return unwrap(res);
};

export const resendOtp = async ({ email }) => {
  const res = await api.post("/auth/resend-otp", { email });
  return unwrap(res);
};

export const forgotPassword = async ({ email }) => {
  const res = await api.post("/auth/forgot-password", { email });
  return unwrap(res);
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const res = await api.post("/auth/reset-password", { email, otp, newPassword });
  return unwrap(res);
};

export const signOut = async () => {
  return true;
};
