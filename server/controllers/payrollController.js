import Payroll from "../models/Payroll.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const myPayroll = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.month) filter.month = String(req.query.month).trim();
    const rows = await Payroll.find(filter).sort({ month: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

export const listPayroll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) filter.user = String(req.query.userId).trim();
    if (req.query.month) filter.month = String(req.query.month).trim();
    const rows = await Payroll.find(filter)
      .populate("user", "employeeId email")
      .sort({ month: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

export const upsertPayroll = async (req, res, next) => {
  try {
    const { userId, month } = req.params;
    const { grossPay, deductions, netPay, currency, notes } = req.body;
    if (!userId || !month) return sendError(res, "userId and month required", 400);

    const payload = {
      ...(grossPay !== undefined ? { grossPay } : {}),
      ...(deductions !== undefined ? { deductions } : {}),
      ...(netPay !== undefined ? { netPay } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(notes !== undefined ? { notes } : {}),
    };

    const row = await Payroll.findOneAndUpdate(
      { user: userId, month },
      { $set: payload },
      { new: true, upsert: true }
    );
    return sendSuccess(res, row, "Payroll updated");
  } catch (err) {
    next(err);
  }
};
