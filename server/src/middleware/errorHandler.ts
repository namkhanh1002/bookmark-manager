import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError, validationError } from "../lib/errors";
import { isProduction } from "../config/env";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (handler: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err && typeof err === "object" && (err as { name?: string }).name === "ZodError") {
    const zodError = err as { issues: { path: (string | number)[]; message: string }[] };
    const details = zodError.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    const apiError = validationError("Please check the highlighted fields", details);
    res.status(apiError.status).json({
      success: false,
      error: { code: apiError.code, message: apiError.message, details: apiError.details },
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err) {
    const prismaError = err as { code?: string; meta?: unknown };
    if (prismaError.code === "P2002") {
      res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "A record with the same unique value already exists" },
      });
      return;
    }
    if (prismaError.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Malformed JSON body" },
    });
    return;
  }

  console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Something went wrong on our end" : String((err as Error)?.message ?? err),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}
