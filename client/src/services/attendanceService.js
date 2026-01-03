import api from "./api";

const unwrap = (res) => {
  const root = res?.data || res;
  if (root && typeof root === "object" && root.data !== undefined) return root.data;
  return root;
};

export const checkIn = async () => {
  const res = await api.post("/attendance/check-in");
  return unwrap(res);
};

export const checkOut = async () => {
  const res = await api.post("/attendance/check-out");
  return unwrap(res);
};

export const breakStart = async () => {
  const res = await api.post("/attendance/break-start");
  return unwrap(res);
};

export const breakEnd = async () => {
  const res = await api.post("/attendance/break-end");
  return unwrap(res);
};

export const getMyAttendance = async ({ from, to } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get("/attendance/me", { params });
  return unwrap(res);
};

export const getMyMonthAttendance = async ({ month } = {}) => {
  const params = {};
  if (month) params.month = month;
  const res = await api.get("/attendance/me/month", { params });
  return unwrap(res);
};

export const listPresentByDate = async ({ date } = {}) => {
  const params = {};
  if (date) params.date = date;
  const res = await api.get("/attendance/present", { params });
  return unwrap(res);
};

export const getWeeklySummary = async ({ from } = {}) => {
  const params = {};
  if (from) params.from = from;
  const res = await api.get("/attendance/weekly-summary", { params });
  return unwrap(res);
};
