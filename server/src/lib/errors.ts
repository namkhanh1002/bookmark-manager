export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, "BAD_REQUEST", message, details);

export const validationError = (message: string, details?: unknown) =>
  new ApiError(400, "VALIDATION_ERROR", message, details);

export const unauthorized = (message = "Yêu cầu đăng nhập") =>
  new ApiError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Bạn không có quyền truy cập tài nguyên này") =>
  new ApiError(403, "FORBIDDEN", message);

export const notFound = (message = "Không tìm thấy tài nguyên") =>
  new ApiError(404, "NOT_FOUND", message);

export const conflict = (message: string) => new ApiError(409, "CONFLICT", message);

export const tooManyRequests = (message = "Quá nhiều yêu cầu, vui lòng thử lại sau") =>
  new ApiError(429, "RATE_LIMITED", message);

export const internalError = (message = "Đã xảy ra lỗi phía máy chủ") =>
  new ApiError(500, "INTERNAL_ERROR", message);
