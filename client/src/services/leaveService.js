
import api from "./api";

const unwrap = (res) => {
  const root = res?.data || res;
  if (root && typeof root === "object" && root.data !== undefined) return root.data;
  return root;
};

export const applyLeave = async ({ type, startDate, endDate, remarks, attachmentName, attachmentUrl } = {}) => {
  const res = await api.post("/leaves", { type, startDate, endDate, remarks, attachmentName, attachmentUrl });
  return unwrap(res);
};

export const uploadLeaveAttachment = async ({ dataUrl, fileName } = {}) => {
  const res = await api.post("/leaves/upload", { dataUrl, fileName });
  return unwrap(res);
};

export const getMyLeaves = async () => {
  const res = await api.get("/leaves/me");
  return unwrap(res);
};

export const listLeaves = async ({ status, userId } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (userId) params.userId = userId;
  const res = await api.get("/leaves", { params });
  return unwrap(res);
};

export const approveLeave = async ({ id, comment } = {}) => {
  const res = await api.patch(`/leaves/${id}/approve`, { comment });
  return unwrap(res);
};

export const rejectLeave = async ({ id, comment } = {}) => {
  const res = await api.patch(`/leaves/${id}/reject`, { comment });
  return unwrap(res);
};

