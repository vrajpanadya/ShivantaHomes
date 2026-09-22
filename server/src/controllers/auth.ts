import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { Admin } from '../models/Admin';
import { AuthRequest, signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logActivity } from '../utils/activity';
import { env } from '../config/env';
import { sendMail } from '../services/mailer';

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  admin.lastLoginAt = new Date();
  await admin.save();
  const token = signToken(admin);
  setAuthCookie(req, res, token);
  await logActivity({ admin, action: 'login', module: 'auth' });
  res.json({ success: true, token, admin: (admin as any).toSafe() });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  clearAuthCookie(req, res);
  await logActivity({ admin: req.admin, action: 'logout', module: 'auth' });
  res.json({ success: true, message: 'Signed out' });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, admin: (req.admin as any).toSafe() });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const admin = req.admin!;
  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  admin.resetToken = null;
  admin.resetTokenExpires = null;
  await admin.save();
  await logActivity({ admin, action: 'password-changed', module: 'auth' });
  res.json({ success: true, message: 'Password updated successfully' });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body as { email: string };
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  // Always report success to avoid account enumeration.
  if (admin) {
    const raw = crypto.randomBytes(32).toString('hex');
    admin.resetToken = crypto.createHash('sha256').update(raw).digest('hex');
    admin.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await admin.save();
    const link = `${env.CLIENT_URL}/admin/reset?token=${raw}`;
    await sendMail(admin.email, 'Reset your Shivanta Homes admin password', `Use this link within 1 hour to reset your password:\n${link}\n\nIf you did not request this, ignore this email.`);
    await logActivity({ admin, action: 'password-reset-requested', module: 'auth' });
  }
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const admin = await Admin.findOne({ resetToken: hashed, resetTokenExpires: { $gt: new Date() } });
  if (!admin) throw new ApiError(400, 'Reset link is invalid or has expired');
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  admin.resetToken = null;
  admin.resetTokenExpires = null;
  await admin.save();
  await logActivity({ admin, action: 'password-reset-completed', module: 'auth' });
  res.json({ success: true, message: 'Password reset successful — you can now sign in' });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body as { name?: string; email?: string };
  const admin = req.admin!;
  if (name) admin.name = name;
  if (email) {
    const existing = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: admin._id } });
    if (existing) throw new ApiError(409, 'Email already in use');
    admin.email = email.toLowerCase();
  }
  await admin.save();
  await logActivity({ admin, action: 'profile-updated', module: 'auth' });
  res.json({ success: true, admin: (admin as any).toSafe() });
});
