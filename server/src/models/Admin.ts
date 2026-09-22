import { Schema, model, Document, Types } from 'mongoose';

export interface IAdmin extends Document<Types.ObjectId> {
  name: string;
  email: string;
  passwordHash: string;
  role: 'superadmin' | 'admin';
  resetToken: string | null;
  resetTokenExpires: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSchema.methods.toSafe = function (this: IAdmin) {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

export const Admin = model<IAdmin>('Admin', adminSchema);
