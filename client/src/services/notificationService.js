import api from "./api";

const unwrap = (res) => {
  const root = res?.data || res;
  if (root && typeof root === "object" && root.data !== undefined) return root.data;
  return root;
};

export const broadcastAlert = async (payload) => {
  const res = await api.post("/notifications/broadcast", payload);
  return unwrap(res);
};

export const alertUser = async (userId, payload) => {
  const res = await api.post(`/notifications/user/${userId}`, payload);
  return unwrap(res);
};

export const getMyNotifications = async () => {
  const res = await api.get("/notifications/my");
  return unwrap(res);
};

export const markRead = async (id) => {
  const res = await api.post(`/notifications/my/${id}/read`);
  return unwrap(res);
};
