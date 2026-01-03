export const requireFields = (fields = []) => {
  return (req, res, next) => {
    const missing = [];
    for (const f of fields) {
      if (req.body?.[f] === undefined || req.body?.[f] === null || req.body?.[f] === "") {
        missing.push(f);
      }
    }
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: "Missing fields", errors: missing });
    }
    next();
  };
};
