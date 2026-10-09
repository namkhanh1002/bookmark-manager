import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";

type Source = "body" | "query" | "params";

function validate(schema: ZodType, source: Source): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === "query") {
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true });
    } else {
      req[source] = result.data as never;
    }
    next();
  };
}

export const validateBody = (schema: ZodType) => validate(schema, "body");
export const validateQuery = (schema: ZodType) => validate(schema, "query");
export const validateParams = (schema: ZodType) => validate(schema, "params");
