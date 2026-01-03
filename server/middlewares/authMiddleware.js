import User from "../models/User.js";
import { verifyToken } from "../config/jwt.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer") return null;
  return token || null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).select("_id email employeeId role isEmailVerified");
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
