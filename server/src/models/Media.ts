import { Schema, model, Document, Types } from 'mongoose';

export const MEDIA_CATEGORIES = ['Architecture', 'Lifestyle', 'Garden', 'Streetscape', 'Evening Views', 'Plans', 'Documents', 'Other'] as const;

export interface IMedia extends Document<Types.ObjectId> {
  title: string;
  url: string;
  publicId: string | null;
  provider: 'cloudinary' | 'local';
  resourceType: 'image' | 'video' | 'document';
  format: string;
  size: number;
  category: (typeof MEDIA_CATEGORIES)[number];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    title: { type: String, trim: true, default: '' },
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    provider: { type: String, enum: ['cloudinary', 'local'], default: 'local' },
    resourceType: { type: String, enum: ['image', 'video', 'document'], required: true },
    format: { type: String, default: '' },
    size: { type: Number, default: 0 },
    category: { type: String, enum: MEDIA_CATEGORIES, default: 'Other' },
    uploadedBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export const Media = model<IMedia>('Media', mediaSchema);
