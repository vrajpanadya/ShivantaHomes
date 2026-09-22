import { Response } from 'express';
import { Media, MEDIA_CATEGORIES } from '../models/Media';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginated } from '../utils/pagination';
import { storeBuffer, removeStored } from '../services/storage';
import { findMediaUsage } from '../services/mediaUsage';
import { ALLOWED_MIMES, maxFor } from '../middleware/upload';
import { logActivity } from '../utils/activity';

/** Admin: upload one or more files */
export const uploadMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) throw new ApiError(400, 'No files uploaded');
  const created = [];
  for (const file of files) {
    if (file.size > maxFor(file.mimetype)) {
      throw new ApiError(400, `${file.originalname} exceeds the size limit for its type`);
    }
    const kind = ALLOWED_MIMES[file.mimetype];
    const stored = await storeBuffer(file.buffer, file.mimetype, kind);
    const doc = await Media.create({
      title: file.originalname.replace(/\.[^.]+$/, ''),
      url: stored.url,
      publicId: stored.publicId,
      provider: stored.provider,
      resourceType: kind,
      format: file.mimetype,
      size: file.size,
      category: (req.body?.category as any) || 'Other',
      uploadedBy: req.admin?.name || 'Admin',
    });
    created.push(doc);
  }
  await logActivity({ admin: req.admin, action: `uploaded ${created.length} file(s)`, module: 'media' });
  res.status(201).json({ success: true, items: created });
});

export const listMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pg = parsePagination(req, 12, 60);
  const filter: any = {};
  if (req.query.category && MEDIA_CATEGORIES.includes(req.query.category as any)) filter.category = req.query.category;
  if (req.query.type) filter.resourceType = req.query.type;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { url: rx }];
  }
  const [docs, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Media.countDocuments(filter),
  ]);
  res.json({ success: true, ...paginated(docs, total, pg) });
});

export const updateMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, category } = req.body as { title?: string; category?: any };
  const doc = await Media.findByIdAndUpdate(
    req.params.id,
    { ...(title !== undefined ? { title } : {}), ...(category !== undefined ? { category } : {}) },
    { new: true }
  );
  if (!doc) throw new ApiError(404, 'Media not found');
  res.json({ success: true, item: doc });
});

export const deleteMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Media.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Media not found');
  const force = req.query.force === 'true';
  const usage = await findMediaUsage(doc.url);
  if (usage.length && !force) {
    throw new ApiError(409, `This media is used by: ${usage.join(', ')}. Remove it from content first, or force delete.`, { usage });
  }
  await removeStored(doc.publicId, doc.url);
  await doc.deleteOne();
  await logActivity({ admin: req.admin, action: 'deleted', module: 'media', targetId: String(doc._id), meta: { url: doc.url, forced: force && usage.length > 0 } });
  res.json({ success: true, message: 'Media deleted' });
});
