import { Response, Request } from 'express';
import { Model, Document } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginated } from '../utils/pagination';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activity';

type AnyModel = Model<Document & Record<string, any>>;

interface CollectionOpts {
  schema?: z.ZodSchema; // used for both create & update (all fields optional-safe)
  searchable?: string[]; // field names for admin search
}

/**
 * Factory producing REST controllers for an ordered collection module
 * (residences, amenities, gallery, videos, floor plans, specifications).
 */
export function collectionControllers(Model: AnyModel, moduleName: string, opts: CollectionOpts = {}) {
  const listPublic = asyncHandler(async (_req: Request, res: Response) => {
    const docs = await Model.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ success: true, items: docs });
  });

  const list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pg = parsePagination(req, 20, 100);
    const filter: any = {};
    if (req.query.active === 'true') filter.active = true;
    if (req.query.active === 'false') filter.active = false;
    if (req.query.search && opts.searchable?.length) {
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = opts.searchable.map((f) => ({ [f]: rx }));
    }
    const [docs, total] = await Promise.all([
      Model.find(filter).sort({ order: 1, createdAt: 1 }).skip(pg.skip).limit(pg.limit).lean(),
      Model.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginated(docs, total, pg) });
  });

  const create = asyncHandler(async (req: AuthRequest, res: Response) => {
    let body = req.body as Record<string, any>;
    if (opts.schema) body = opts.schema.parse(body);
    if (body.order === undefined) body.order = (await Model.countDocuments()) + 1;
    const doc = await Model.create(body);
    await logActivity({ admin: req.admin, action: 'created', module: moduleName, targetId: String(doc._id) });
    res.status(201).json({ success: true, item: doc });
  });

  const update = asyncHandler(async (req: AuthRequest, res: Response) => {
    let body = req.body as Record<string, any>;
    if (opts.schema) body = opts.schema.parse(body);
    const doc = await Model.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!doc) throw new ApiError(404, 'Not found');
    await logActivity({ admin: req.admin, action: 'updated', module: moduleName, targetId: String(doc._id) });
    res.json({ success: true, item: doc });
  });

  const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw new ApiError(404, 'Not found');
    await logActivity({ admin: req.admin, action: 'deleted', module: moduleName, targetId: String(doc._id) });
    res.json({ success: true, message: 'Deleted' });
  });

  const reorder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, i) => Model.updateOne({ _id: id }, { order: i + 1 })));
    await logActivity({ admin: req.admin, action: 'reordered', module: moduleName });
    res.json({ success: true, message: 'Order updated' });
  });

  return { listPublic, list, create, update, remove, reorder };
}

/**
 * Factory producing REST controllers for a singleton module
 * (hero, overview, location, brochure, settings, seo).
 */
export function singletonControllers(Model: AnyModel, moduleName: string, schema?: z.ZodSchema) {
  const getPublic = asyncHandler(async (_req: Request, res: Response) => {
    const doc = await Model.findOne().lean();
    res.json({ success: true, item: doc ?? null });
  });

  const get = getPublic;

  const update = asyncHandler(async (req: AuthRequest, res: Response) => {
    let body = req.body as Record<string, any>;
    if (schema) body = schema.parse(body);
    const doc = await Model.findOneAndUpdate({}, body, { new: true, upsert: true, setDefaultsOnInsert: true });
    await logActivity({ admin: req.admin, action: 'updated', module: moduleName });
    res.json({ success: true, item: doc });
  });

  return { getPublic, get, update };
}
