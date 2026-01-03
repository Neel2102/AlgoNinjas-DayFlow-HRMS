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

export const getMyAttendance = async ({ from, to } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get("/attendance/me", { params });
  return unwrap(res);
};
