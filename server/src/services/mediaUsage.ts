import {
  Hero, ProjectOverview, Residence, Amenity, GalleryItem, ProjectVideo,
  FloorPlan, Specification, ProjectLocation, Brochure, SiteSettings, SeoSettings,
} from '../models/content';

const CONTENT_MODELS: { name: string; model: { find: (q: object) => { lean: () => Promise<unknown[]> } } }[] = [
  { name: 'Hero', model: Hero },
  { name: 'ProjectOverview', model: ProjectOverview },
  { name: 'Residence', model: Residence },
  { name: 'Amenity', model: Amenity },
  { name: 'Gallery', model: GalleryItem },
  { name: 'Video', model: ProjectVideo },
  { name: 'FloorPlan', model: FloorPlan },
  { name: 'Specification', model: Specification },
  { name: 'Location', model: ProjectLocation },
  { name: 'Brochure', model: Brochure },
  { name: 'Settings', model: SiteSettings },
  { name: 'SEO', model: SeoSettings },
];

/**
 * Returns the names of content modules currently referencing a media URL.
 * Used to prevent accidental deletion of media in use by the website.
 */
export async function findMediaUsage(url: string): Promise<string[]> {
  if (!url) return [];
  const used: string[] = [];
  for (const { name, model } of CONTENT_MODELS) {
    try {
      const docs = await model.find({}).lean();
      if (docs.some((d) => JSON.stringify(d).includes(url))) used.push(name);
    } catch {
      /* ignore model errors */
    }
  }
  return used;
}
