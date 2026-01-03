
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

export const upsertPayroll = async ({ userId, month, grossPay, deductions, netPay, currency, notes } = {}) => {
  const res = await api.put(`/payroll/${userId}/${month}`, {
    grossPay,
    deductions,
    netPay,
    currency,
    notes,
  });
  return unwrap(res);
};

