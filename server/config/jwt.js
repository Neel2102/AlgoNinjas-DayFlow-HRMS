import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && String(secret).trim().length > 0) return String(secret).trim();
  return "dev_jwt_secret_change_me";
};

export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: options.expiresIn || "7d",
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
