import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  return res.status(404).json({ success: false, message: "Not Found" });
};

export const errorHandler = (err, req, res, next) => {
  logger.error(err);
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({ success: false, message });
};
