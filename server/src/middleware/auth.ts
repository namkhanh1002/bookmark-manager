import type { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../lib/jwt";
import { unauthorized, forbidden } from "../lib/errors";
import { prisma } from "../lib/prisma";

export function requireUserId(req: Request): string {
  if (!req.userId) throw unauthorized();
  return req.userId;
}

export const requireAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized("Missing access token. Please sign in.");
    }

    const token = header.slice(7).trim();
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!user) throw forbidden("Account no longer exists");

    req.userId = user.id;
    next();
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as Error).name === "JsonWebTokenError") {
      next(unauthorized("Invalid or expired access token"));
      return;
    }
    if (err && typeof err === "object" && "name" in err && (err as Error).name === "TokenExpiredError") {
      next(unauthorized("Session expired, please sign in again"));
      return;
    }
    next(err);
  }
};
