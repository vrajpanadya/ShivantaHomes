import { Response } from 'express';
import { SiteVisit, VISIT_STATUSES } from '../models/SiteVisit';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginated } from '../utils/pagination';
import { logActivity } from '../utils/activity';

function buildFilter(query: any) {
  const filter: any = {};
  if (query.status && VISIT_STATUSES.includes(query.status)) filter.status = query.status;
  if (query.date) {
    filter.visitDate = { $gte: new Date(`${query.date}T00:00:00.000Z`), $lte: new Date(`${query.date}T23:59:59.999Z`) };
  } else if (query.from || query.to) {
    filter.visitDate = {};
    if (query.from) filter.visitDate.$gte = new Date(query.from);
    if (query.to) filter.visitDate.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  if (query.search) {
    const rx = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ customerName: rx }, { phone: rx }, { email: rx }];
  }
  return filter;
}

export const listVisits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pg = parsePagination(req, 10);
  const filter = buildFilter(req.query);
  const [docs, total] = await Promise.all([
    SiteVisit.find(filter).sort({ visitDate: 1, visitTime: 1 }).skip(pg.skip).limit(pg.limit).populate('enquiry', 'fullName enquiryType status').lean(),
    SiteVisit.countDocuments(filter),
  ]);
  res.json({ success: true, ...paginated(docs, total, pg) });
});

export const getVisit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await SiteVisit.findById(req.params.id).populate('enquiry', 'fullName mobile enquiryType status').lean();
  if (!doc) throw new ApiError(404, 'Site visit not found');
  res.json({ success: true, item: doc });
});

export const createVisit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as any;
  const doc = await SiteVisit.create({
    customerName: body.customerName,
    phone: body.phone.replace(/^(\+91[\s-]?)/, '').replace(/[\s-]/g, ''),
    email: body.email || '',
    visitDate: new Date(body.visitDate),
    visitTime: body.visitTime || '10:00',
    visitors: body.visitors || 2,
    interest: body.interest || '3 BHK Residence',
    notes: body.notes || '',
    status: body.status || 'Requested',
    enquiry: body.enquiryId || null,
  });
  if (body.enquiryId) {
    const { Enquiry } = await import('../models/Enquiry');
    await Enquiry.findByIdAndUpdate(body.enquiryId, { status: 'Site Visit Scheduled' }).catch(() => undefined);
  }
  await logActivity({ admin: req.admin, action: 'created', module: 'site-visits', targetId: String(doc._id), meta: { name: doc.customerName } });
  res.status(201).json({ success: true, item: doc });
});

export const updateVisit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as any;
  if (body.visitDate) body.visitDate = new Date(body.visitDate);
  if (body.phone) body.phone = body.phone.replace(/^(\+91[\s-]?)/, '').replace(/[\s-]/g, '');
  if (body.enquiryId !== undefined) body.enquiry = body.enquiryId || null;
  delete body.enquiryId;
  const doc = await SiteVisit.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!doc) throw new ApiError(404, 'Site visit not found');
  await logActivity({ admin: req.admin, action: body.status ? `status → ${body.status}` : 'updated', module: 'site-visits', targetId: String(doc._id) });
  res.json({ success: true, item: doc });
});

export const deleteVisit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await SiteVisit.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Site visit not found');
  await logActivity({ admin: req.admin, action: 'deleted', module: 'site-visits', targetId: String(doc._id) });
  res.json({ success: true, message: 'Site visit deleted' });
});
