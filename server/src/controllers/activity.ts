import { Response } from 'express';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, paginated } from '../utils/pagination';

export const listActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pg = parsePagination(req, 15, 100);
  const filter: any = {};
  if (req.query.module) filter.module = req.query.module;
  const [docs, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);
  res.json({ success: true, ...paginated(docs, total, pg) });
});
