import { ActivityLog } from '../models/ActivityLog';

/**
 * Records an admin action. Never stores passwords or auth tokens.
 */
export async function logActivity(entry: {
  admin?: { _id?: unknown; email?: string; name?: string } | null;
  action: string;
  module: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ActivityLog.create({
      adminId: entry.admin?._id ?? null,
      adminEmail: entry.admin?.email ?? 'system',
      adminName: entry.admin?.name ?? 'System',
      action: entry.action,
      module: entry.module,
      targetId: entry.targetId ?? null,
      meta: entry.meta ?? {},
    });
  } catch (err) {
    // Logging must never break the request cycle.
    console.error('[activity] failed to log', err);
  }
}
