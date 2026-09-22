import { z } from 'zod';
import { ENQUIRY_STATUSES, ENQUIRY_TYPES, ENQUIRY_SOURCES } from '../models/Enquiry';
import { VISIT_STATUSES } from '../models/SiteVisit';

/* ---------------------------------- Auth ---------------------------------- */
export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export const forgotPasswordSchema = z.object({ email: z.string().trim().email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().optional(),
});

/* -------------------------------- Enquiries ------------------------------- */
export const createEnquirySchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().email().optional().or(z.literal('')),
  enquiryType: z.enum(ENQUIRY_TYPES).default('3 BHK Residence'),
  preferredVisitDate: z.string().optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  source: z.enum(ENQUIRY_SOURCES).default('Website'),
});
export const updateEnquirySchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  mobile: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  enquiryType: z.enum(ENQUIRY_TYPES).optional(),
  preferredVisitDate: z.string().optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  source: z.enum(ENQUIRY_SOURCES).optional(),
});
export const noteSchema = z.object({ text: z.string().trim().min(1).max(2000) });

/* -------------------------------- Site visits ----------------------------- */
export const createVisitSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().email().optional().or(z.literal('')),
  visitDate: z.string().min(1, 'Visit date is required'),
  visitTime: z.string().default('10:00'),
  visitors: z.coerce.number().int().min(1).max(20).default(2),
  interest: z.string().max(120).default('3 BHK Residence'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(VISIT_STATUSES).default('Requested'),
  enquiryId: z.string().optional().or(z.literal('')),
});
export const updateVisitSchema = createVisitSchema.partial().omit({ enquiryId: true }).extend({
  enquiryId: z.string().optional().or(z.literal('')),
});
