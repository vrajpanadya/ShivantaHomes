import { Schema, model, Document, Types } from 'mongoose';

export const ENQUIRY_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Site Visit Scheduled',
  'Follow-up',
  'Converted',
  'Closed',
] as const;

export const ENQUIRY_TYPES = ['3 BHK Residence', 'Open Plot', 'General'] as const;
export const ENQUIRY_SOURCES = ['Website', 'Instagram', 'Facebook', 'Walk-in', 'Referral', 'Other'] as const;

export interface INote {
  text: string;
  createdBy: string;
  createdAt: Date;
}

export interface IEnquiry extends Document<Types.ObjectId> {
  fullName: string;
  mobile: string;
  email: string;
  enquiryType: (typeof ENQUIRY_TYPES)[number];
  preferredVisitDate: Date | null;
  message: string;
  status: (typeof ENQUIRY_STATUSES)[number];
  notes: INote[];
  source: (typeof ENQUIRY_SOURCES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    enquiryType: { type: String, enum: ENQUIRY_TYPES, default: '3 BHK Residence', index: true },
    preferredVisitDate: { type: Date, default: null },
    message: { type: String, trim: true, default: '', maxlength: 2000 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'New', index: true },
    notes: [
      {
        text: { type: String, required: true, maxlength: 2000 },
        createdBy: { type: String, default: 'Admin' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    source: { type: String, enum: ENQUIRY_SOURCES, default: 'Website' },
  },
  { timestamps: true }
);

export const Enquiry = model<IEnquiry>('Enquiry', enquirySchema);
