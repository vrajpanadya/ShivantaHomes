import { Schema, model, Document, Types } from 'mongoose';

export const VISIT_STATUSES = ['Requested', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'] as const;

export interface ISiteVisit extends Document<Types.ObjectId> {
  customerName: string;
  phone: string;
  email: string;
  visitDate: Date;
  visitTime: string;
  visitors: number;
  interest: string;
  notes: string;
  status: (typeof VISIT_STATUSES)[number];
  enquiry: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const siteVisitSchema = new Schema<ISiteVisit>(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    visitDate: { type: Date, required: true, index: true },
    visitTime: { type: String, default: '10:00' },
    visitors: { type: Number, default: 2, min: 1, max: 20 },
    interest: { type: String, default: '3 BHK Residence' },
    notes: { type: String, default: '', maxlength: 2000 },
    status: { type: String, enum: VISIT_STATUSES, default: 'Requested', index: true },
    enquiry: { type: Schema.Types.ObjectId, ref: 'Enquiry', default: null },
  },
  { timestamps: true }
);

export const SiteVisit = model<ISiteVisit>('SiteVisit', siteVisitSchema);
