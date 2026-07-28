// Simple in-memory sliding-window rate limiter (no external dependency needed).
// Not suitable for multi-instance deployments (state isn't shared), but is
// enough to blunt abuse of low-traffic, sensitive endpoints like password reset.
const hits = new Map();

export const rateLimit = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now - record.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    if (record.count >= max) {
      res.status(429);
      throw new Error(message || "Too many requests, please try again later.");
    }

    record.count += 1;
    next();
  };
};
