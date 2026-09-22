import { Response } from 'express';
import { Enquiry, ENQUIRY_STATUSES, ENQUIRY_TYPES } from '../models/Enquiry';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginated } from '../utils/pagination';
import { toCSV } from '../utils/csv';
import { logActivity } from '../utils/activity';
import { notifyAdminNewEnquiry } from '../services/mailer';

const normalizeMobile = (m: string) => m.replace(/^(\+91[\s-]?)/, '').replace(/[\s-]/g, '');

/** Public: submit an enquiry */
export const createEnquiry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as any;
  const mobile = normalizeMobile(body.mobile);

  // Prevent duplicate rapid submissions (same mobile within 60s).
  const recent = await Enquiry.findOne({ mobile, createdAt: { $gt: new Date(Date.now() - 60_000) } });
  if (recent) throw new ApiError(429, 'We have already received your enquiry. Our team will contact you soon.');

  const enquiry = await Enquiry.create({
    fullName: body.fullName,
    mobile,
    email: body.email || '',
    enquiryType: body.enquiryType || '3 BHK Residence',
    preferredVisitDate: body.preferredVisitDate ? new Date(body.preferredVisitDate) : null,
    message: body.message || '',
    source: body.source || 'Website',
    status: 'New',
  });

  notifyAdminNewEnquiry(enquiry).catch(() => undefined);
  res.status(201).json({ success: true, message: 'Thank you! Our team will contact you shortly.', enquiry: { id: enquiry._id } });
});

function buildFilter(query: any) {
  const filter: any = {};
  if (query.status && ENQUIRY_STATUSES.includes(query.status)) filter.status = query.status;
  if (query.type && ENQUIRY_TYPES.includes(query.type)) filter.enquiryType = query.type;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  if (query.search) {
    const rx = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ fullName: rx }, { mobile: rx }, { email: rx }];
  }
  return filter;
}

export const listEnquiries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pg = parsePagination(req, 10);
  const filter = buildFilter(req.query);
  const sort: Record<string, 1 | -1> = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const [docs, total] = await Promise.all([
    Enquiry.find(filter).sort(sort).skip(pg.skip).limit(pg.limit).lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({ success: true, ...paginated(docs, total, pg) });
});

export const getEnquiry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Enquiry.findById(req.params.id).lean();
  if (!doc) throw new ApiError(404, 'Enquiry not found');
  res.json({ success: true, item: doc });
});

export const updateEnquiry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as any;
  if (body.mobile) body.mobile = normalizeMobile(body.mobile);
  if (body.preferredVisitDate !== undefined) body.preferredVisitDate = body.preferredVisitDate ? new Date(body.preferredVisitDate) : null;
  const doc = await Enquiry.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!doc) throw new ApiError(404, 'Enquiry not found');
  if (body.status) {
    await logActivity({ admin: req.admin, action: `status → ${body.status}`, module: 'enquiries', targetId: String(doc._id), meta: { name: doc.fullName } });
  } else {
    await logActivity({ admin: req.admin, action: 'updated', module: 'enquiries', targetId: String(doc._id) });
  }
  res.json({ success: true, item: doc });
});

export const addNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Enquiry.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Enquiry not found');
  doc.notes.push({ text: (req.body as any).text, createdBy: req.admin?.name || 'Admin', createdAt: new Date() });
  await doc.save();
  await logActivity({ admin: req.admin, action: 'note-added', module: 'enquiries', targetId: String(doc._id) });
  res.json({ success: true, item: doc });
});

export const deleteEnquiry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Enquiry.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Enquiry not found');
  await logActivity({ admin: req.admin, action: 'deleted', module: 'enquiries', targetId: String(doc._id), meta: { name: doc.fullName } });
  res.json({ success: true, message: 'Enquiry deleted' });
});

export const exportCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
  const docs = await Enquiry.find(buildFilter(req.query)).sort({ createdAt: -1 }).limit(5000).lean();
  const csv = toCSV(
    docs.map((d: any) => ({
      name: d.fullName, mobile: d.mobile, email: d.email, type: d.enquiryType, status: d.status,
      source: d.source, preferredVisit: d.preferredVisitDate ? new Date(d.preferredVisitDate).toISOString().slice(0, 10) : '',
      message: d.message, created: d.createdAt,
    })),
    [
      { key: 'name', header: 'Full Name' }, { key: 'mobile', header: 'Mobile' }, { key: 'email', header: 'Email' },
      { key: 'type', header: 'Type' }, { key: 'status', header: 'Status' }, { key: 'source', header: 'Source' },
      { key: 'preferredVisit', header: 'Preferred Visit' }, { key: 'message', header: 'Message' }, { key: 'created', header: 'Created' },
    ]
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=enquiries-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});
