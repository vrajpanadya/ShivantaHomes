import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth';
import { collectionControllers, singletonControllers } from '../controllers/content';
import {
  Hero, ProjectOverview, Residence, Amenity, GalleryItem, ProjectVideo,
  FloorPlan, Specification, ProjectLocation, Brochure, SiteSettings, SeoSettings,
} from '../models/content';
import * as v from '../validators/content';

/**
 * Public read endpoints are open; every mutation requires admin auth.
 * Collection admin lists live at `<path>/list`.
 */
export default function contentRoutes(): Router {
  const r = Router();
  const admin = [protect, requireRole('admin', 'superadmin')] as const;

  const mountCollection = (
    path: string,
    Model: any,
    name: string,
    schema: any,
    searchable: string[]
  ) => {
    const c = collectionControllers(Model, name, { schema, searchable });
    r.get(path, c.listPublic);
    r.get(`${path}/list`, ...admin, c.list);
    r.post(path, ...admin, c.create);
    r.put(`${path}/reorder`, ...admin, c.reorder);
    r.put(`${path}/:id`, ...admin, c.update);
    r.delete(`${path}/:id`, ...admin, c.remove);
  };

  const mountSingleton = (path: string, Model: any, name: string, schema: any) => {
    const c = singletonControllers(Model, name, schema);
    r.get(path, c.getPublic);
    r.put(path, ...admin, c.update);
  };

  mountSingleton('/hero', Hero, 'hero', v.heroSchema);
  mountSingleton('/project-overview', ProjectOverview, 'project-overview', v.overviewSchema);
  mountCollection('/residences', Residence, 'residences', v.residenceSchema, ['title', 'subtitle']);
  mountCollection('/amenities', Amenity, 'amenities', v.amenitySchema, ['name']);
  mountCollection('/gallery', GalleryItem, 'gallery', v.gallerySchema, ['title', 'alt']);
  mountCollection('/videos', ProjectVideo, 'videos', v.videoSchema, ['title']);
  mountCollection('/floor-plans', FloorPlan, 'floor-plans', v.floorPlanSchema, ['title', 'propertyType']);
  mountCollection('/specifications', Specification, 'specifications', v.specificationSchema, ['title', 'category']);
  mountSingleton('/location', ProjectLocation, 'location', v.locationSchema);
  mountSingleton('/brochure', Brochure, 'brochure', v.brochureSchema);
  mountSingleton('/settings', SiteSettings, 'settings', v.settingsSchema);
  mountSingleton('/seo', SeoSettings, 'seo', v.seoSchema);

  return r;
}
