import api from "./api";

const unwrap = (res) => {
  if (res && res.data && typeof res.data === "object") return res.data;
  return res;
};

export const signIn = async ({ email, password }) => {
  const res = await api.post("/auth/signin", { email, password });
  return unwrap(res);
};

export const signUp = async ({ employeeId, email, password }) => {
  const res = await api.post("/auth/signup", { employeeId, email, password });
  return unwrap(res);
};

export const signOut = async () => {
  return true;
};
