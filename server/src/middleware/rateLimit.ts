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
  message: jsonMessage("Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Quá nhiều lần thử đăng nhập, vui lòng thử lại sau vài phút."),
});

export const metadataLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Đã đạt giới hạn lấy metadata, vui lòng đợi lát nữa."),
});
