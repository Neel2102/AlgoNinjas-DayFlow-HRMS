import api from "./api";

const unwrap = (res) => {
  const root = res?.data || res;
  if (root && typeof root === "object" && root.data !== undefined) return root.data;
  return root;
};

export const getMyProfile = async () => {
  const res = await api.get("/employees/me");
  return unwrap(res);
};

export const updateMyProfile = async (payload) => {
  const res = await api.put("/employees/me", payload);
  return unwrap(res);
};

export const listEmployees = async () => {
  const res = await api.get("/employees");
  return unwrap(res);
};

export const getEmployeeById = async (id) => {
  const res = await api.get(`/employees/${id}`);
  return unwrap(res);
};

export const updateEmployeeById = async (id, payload) => {
  const res = await api.put(`/employees/${id}`, payload);
  return unwrap(res);
};
