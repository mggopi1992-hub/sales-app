import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'admin' | 'employee';
export interface JwtUser { id: number; name: string; email: string; role: Role }

declare global {
  namespace Express { interface Request { user?: JwtUser } }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/** Authentication + role-based authorization. requireAuth() = any logged-in user. */
export const requireAuth = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  try {
    const user = jwt.verify(h.slice(7), JWT_SECRET) as JwtUser;
    if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
};
