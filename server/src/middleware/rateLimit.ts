import { rateLimit } from "express-rate-limit";

const jsonMessage = (message: string) => ({
  success: false,
  error: { code: "RATE_LIMITED", message },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests from this IP, please try again later."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many authentication attempts, please try again in a few minutes."),
});

export const metadataLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Metadata fetching rate limit reached, please wait a moment."),
});
