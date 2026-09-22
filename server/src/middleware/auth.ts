import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env';
import { Admin, IAdmin } from '../models/Admin';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export interface AuthRequest extends Request {
  admin?: IAdmin;
}

export const COOKIE_NAME = 'sh_token';
/** Custom token header used by the admin SPA (some reverse proxies strip/repurpose `Authorization`). */
export const TOKEN_HEADER = 'x-auth-token';
const SESSION_MS = 12 * 60 * 60 * 1000;

export function signToken(admin: IAdmin): string {
  return jwt.sign({ id: admin._id.toString(), role: admin.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Cookie attributes. Over HTTPS (production or behind a TLS proxy) we use
 * `SameSite=None; Secure` so the session also works when the site is embedded
 * in a cross-site frame (preview tools, dashboards). Plain-HTTP dev keeps `Lax`.
 * Cross-site abuse of the cookie is blocked by the X-Requested-With guard below.
 */
function cookieOptions(req: Request) {
  const secure = isProduction || req.secure;
  return { httpOnly: true, secure, sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax', path: '/' };
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(req), maxAge: SESSION_MS });
}

export function clearAuthCookie(req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Protects admin routes. Accepts X-Auth-Token header, Bearer token, or the HTTP-only cookie. */
export const protect = asyncHandler(async (req: AuthRequest, _res, next) => {
  const xauth = req.headers[TOKEN_HEADER];
  const bearer = req.headers.authorization;
  const cookie = req.cookies?.[COOKIE_NAME] as string | undefined;

  let token: string | null = null;
  let source = 'none';
  if (typeof xauth === 'string' && xauth) {
    token = xauth;
    source = 'header';
  } else if (bearer && bearer.startsWith('Bearer ')) {
    token = bearer.slice(7);
    source = 'bearer';
  } else if (cookie) {
    token = cookie;
    source = 'cookie';
  }

  const deny = (status: number, message: string, reason: string): never => {
    console.warn(
      `[auth] ${status} ${req.method} ${req.originalUrl} reason=${reason} xauth=${xauth ? 1 : 0} bearer=${bearer ? 1 : 0} cookie=${cookie ? 1 : 0}`
    );
    throw new ApiError(status, message);
  };

  if (!token) deny(401, 'Authentication required', 'no-token');

  // CSRF guard: cookie-authenticated state-changing requests must come from our SPA
  // (custom header → cross-site forms cannot send it, cross-site fetch is stopped by CORS preflight).
  if (source === 'cookie' && !SAFE_METHODS.has(req.method) && !req.headers['x-requested-with']) {
    deny(403, 'Cross-site request blocked', 'csrf');
  }

  let decoded: { id: string; role: string };
  try {
    decoded = jwt.verify(token as string, env.JWT_SECRET) as { id: string; role: string };
  } catch (err) {
    const expired = (err as Error)?.name === 'TokenExpiredError';
    deny(401, expired ? 'Session expired — please sign in again' : 'Invalid session — please sign in again', expired ? 'expired' : 'invalid-token');
  }
  const admin = await Admin.findById(decoded!.id);
  if (!admin) deny(401, 'Account no longer exists', 'no-account');
  req.admin = admin!;
  next();
});

export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
