
import api from "./api";

const unwrap = (res) => {
  const root = res?.data || res;
  if (root && typeof root === "object" && root.data !== undefined) return root.data;
  return root;
};

export const getMyPayroll = async ({ month } = {}) => {
  const params = {};
  if (month) params.month = month;
  const res = await api.get("/payroll/me", { params });
  return unwrap(res);
};

export const listPayroll = async ({ userId, month } = {}) => {
  const params = {};
  if (userId) params.userId = userId;
  if (month) params.month = month;
  const res = await api.get("/payroll", { params });
  return unwrap(res);
};

export const generatePayrollForUser = async ({ userId, month, notes } = {}) => {
  const res = await api.post(`/payroll/${userId}/${month}/generate`, { notes });
  return unwrap(res);
};

export const generatePayrollForAll = async ({ month, notes } = {}) => {
  const res = await api.post(`/payroll/generate/${month}`, { notes });
  return unwrap(res);
};

