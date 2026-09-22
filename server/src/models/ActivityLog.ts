import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document<Types.ObjectId> {
  adminId: Types.ObjectId | null;
  adminEmail: string;
  adminName: string;
  action: string;
  module: string;
  targetId: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    adminEmail: { type: String, default: 'system' },
    adminName: { type: String, default: 'System' },
    action: { type: String, required: true },
    module: { type: String, required: true, index: true },
    targetId: { type: String, default: null },
    meta: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
