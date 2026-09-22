import { z } from 'zod';
import { GALLERY_CATEGORIES } from '../models/content';
import { SPEC_CATEGORIES } from '../models/content';

const str = z.string().trim();
const optStr = str.max(4000).optional().or(z.literal(''));
const strArr = z.array(z.string().trim()).optional();
const bool = z.boolean().optional();
const num = z.number().int().optional();

export const heroSchema = z.object({
  label: optStr, heading: optStr, description: optStr,
  primaryCta: z.object({ text: str, href: str }).optional(),
  secondaryCta: z.object({ text: str, href: str }).optional(),
  videoUrl: optStr, posterUrl: optStr, active: bool,
});

export const overviewSchema = z.object({
  heading: optStr, description: optStr, highlights: strArr,
  stats: z.array(z.object({ value: str, label: str })).optional(),
  images: strArr, active: bool,
});

export const residenceSchema = z.object({
  title: str.min(1).max(120), subtitle: optStr, description: optStr,
  features: strArr, images: strArr, videoUrl: optStr, active: bool, order: num,
});

export const amenitySchema = z.object({
  name: str.min(1).max(80), description: optStr, icon: optStr, image: optStr, active: bool, order: num,
});

export const gallerySchema = z.object({
  title: str.min(1).max(120), alt: optStr, url: str.min(1),
  category: z.enum(GALLERY_CATEGORIES).optional(), featured: bool, active: bool, order: num,
});

export const videoSchema = z.object({
  title: str.min(1).max(120), url: str.min(1), poster: optStr,
  type: z.enum(['Walkthrough', 'Drone', 'Amenities', 'Other']).optional(), active: bool, order: num,
});

export const floorPlanSchema = z.object({
  title: str.min(1).max(120), image: str.min(1), propertyType: optStr, plotSize: optStr,
  description: optStr, downloadUrl: optStr, active: bool, order: num,
});

export const specificationSchema = z.object({
  category: z.enum(SPEC_CATEGORIES).optional(), title: str.min(1).max(120),
  description: optStr, icon: optStr, active: bool, order: num,
});

export const locationSchema = z.object({
  address: optStr, lat: z.number().optional(), lng: z.number().optional(),
  mapsLink: optStr, embedUrl: optStr,
  landmarks: z.array(z.object({ name: str, distance: str })).optional(), active: bool,
});

export const brochureSchema = z.object({
  title: optStr, fileUrl: optStr, previewImage: optStr, version: optStr,
  active: bool, uploadedAt: z.string().optional(),
});

export const settingsSchema = z.object({
  projectName: optStr, tagline: optStr, phone: optStr, whatsapp: optStr, email: optStr,
  address: optStr, instagram: optStr, facebook: optStr, mapsLink: optStr,
  footerText: optStr, copyright: optStr,
});

export const seoSchema = z.object({
  title: optStr, description: optStr, keywords: optStr, canonical: optStr,
  ogImage: optStr, index: z.boolean().optional(), structuredData: z.record(z.unknown()).optional(),
});

export const reorderSchema = z.object({ ids: z.array(z.string().min(1)) });
