import { Schema, model, Document, Types } from 'mongoose';

/* ---------------------------------- Hero ---------------------------------- */
export interface IHero extends Document<Types.ObjectId> {
  label: string;
  heading: string;
  description: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
  videoUrl: string;
  posterUrl: string;
  active: boolean;
  updatedAt: Date;
}
const heroSchema = new Schema<IHero>(
  {
    label: { type: String, default: '' },
    heading: { type: String, default: '' },
    description: { type: String, default: '' },
    primaryCta: { text: { type: String, default: 'Book a Site Visit' }, href: { type: String, default: '#contact' } },
    secondaryCta: { text: { type: String, default: 'Explore Residences' }, href: { type: String, default: '#residences' } },
    videoUrl: { type: String, default: '' },
    posterUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const Hero = model<IHero>('Hero', heroSchema);

/* ---------------------------- Project Overview ---------------------------- */
export interface IProjectOverview extends Document<Types.ObjectId> {
  heading: string;
  description: string;
  highlights: string[];
  stats: { value: string; label: string }[];
  images: string[];
  active: boolean;
  updatedAt: Date;
}
const overviewSchema = new Schema<IProjectOverview>(
  {
    heading: { type: String, default: '' },
    description: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    stats: { type: [{ value: String, label: String }], default: [] },
    images: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const ProjectOverview = model<IProjectOverview>('ProjectOverview', overviewSchema);

/* -------------------------------- Residence ------------------------------- */
export interface IResidence extends Document<Types.ObjectId> {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  images: string[];
  videoUrl: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const residenceSchema = new Schema<IResidence>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    features: { type: [String], default: [] },
    images: { type: [String], default: [] },
    videoUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export const Residence = model<IResidence>('Residence', residenceSchema);

/* --------------------------------- Amenity -------------------------------- */
export interface IAmenity extends Document<Types.ObjectId> {
  name: string;
  description: string;
  icon: string;
  image: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const amenitySchema = new Schema<IAmenity>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'gate' },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export const Amenity = model<IAmenity>('Amenity', amenitySchema);

/* ------------------------------- GalleryItem ------------------------------ */
export const GALLERY_CATEGORIES = ['Architecture', 'Lifestyle', 'Garden', 'Streetscape', 'Evening Views', 'Plans'] as const;
export interface IGalleryItem extends Document<Types.ObjectId> {
  title: string;
  alt: string;
  url: string;
  category: (typeof GALLERY_CATEGORIES)[number];
  featured: boolean;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const gallerySchema = new Schema<IGalleryItem>(
  {
    title: { type: String, required: true, trim: true },
    alt: { type: String, default: '' },
    url: { type: String, required: true },
    category: { type: String, enum: GALLERY_CATEGORIES, default: 'Architecture', index: true },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export const GalleryItem = model<IGalleryItem>('GalleryItem', gallerySchema);

/* ------------------------------- ProjectVideo ----------------------------- */
export interface IProjectVideo extends Document<Types.ObjectId> {
  title: string;
  url: string;
  poster: string;
  type: 'Walkthrough' | 'Drone' | 'Amenities' | 'Other';
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const videoSchema = new Schema<IProjectVideo>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    poster: { type: String, default: '' },
    type: { type: String, enum: ['Walkthrough', 'Drone', 'Amenities', 'Other'], default: 'Walkthrough' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export const ProjectVideo = model<IProjectVideo>('ProjectVideo', videoSchema);

/* -------------------------------- FloorPlan ------------------------------- */
export interface IFloorPlan extends Document<Types.ObjectId> {
  title: string;
  image: string;
  propertyType: string;
  plotSize: string;
  description: string;
  downloadUrl: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const floorPlanSchema = new Schema<IFloorPlan>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    propertyType: { type: String, default: '3 BHK Row House' },
    plotSize: { type: String, default: "20' × 40'" },
    description: { type: String, default: '' },
    downloadUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export const FloorPlan = model<IFloorPlan>('FloorPlan', floorPlanSchema);

/* ------------------------------ Specification ----------------------------- */
export const SPEC_CATEGORIES = ['Structure', 'Electrification', 'Flooring', 'Doors', 'Windows', 'Wall Finish', 'Toilet and Plumbing', 'Kitchen'] as const;
export interface ISpecification extends Document<Types.ObjectId> {
  category: (typeof SPEC_CATEGORIES)[number];
  title: string;
  description: string;
  icon: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const specificationSchema = new Schema<ISpecification>(
  {
    category: { type: String, enum: SPEC_CATEGORIES, default: 'Structure', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'structure' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export const Specification = model<ISpecification>('Specification', specificationSchema);

/* ----------------------------- ProjectLocation ---------------------------- */
export interface IProjectLocation extends Document<Types.ObjectId> {
  address: string;
  lat: number;
  lng: number;
  mapsLink: string;
  embedUrl: string;
  landmarks: { name: string; distance: string }[];
  active: boolean;
  updatedAt: Date;
}
const locationSchema = new Schema<IProjectLocation>(
  {
    address: { type: String, default: '' },
    lat: { type: Number, default: 21.7051 },
    lng: { type: Number, default: 72.9756 },
    mapsLink: { type: String, default: '' },
    embedUrl: { type: String, default: '' },
    landmarks: { type: [{ name: String, distance: String }], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const ProjectLocation = model<IProjectLocation>('ProjectLocation', locationSchema);

/* --------------------------------- Brochure ------------------------------- */
export interface IBrochure extends Document<Types.ObjectId> {
  title: string;
  fileUrl: string;
  previewImage: string;
  version: string;
  active: boolean;
  uploadedAt: Date;
  updatedAt: Date;
}
const brochureSchema = new Schema<IBrochure>(
  {
    title: { type: String, default: 'SHIVANTA HOMES — 3 BHK Brochure' },
    fileUrl: { type: String, default: '' },
    previewImage: { type: String, default: '' },
    version: { type: String, default: '1.0' },
    active: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
export const Brochure = model<IBrochure>('Brochure', brochureSchema);

/* ------------------------------- SiteSettings ----------------------------- */
export interface ISiteSettings extends Document<Types.ObjectId> {
  projectName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  mapsLink: string;
  footerText: string;
  copyright: string;
  updatedAt: Date;
}
const settingsSchema = new Schema<ISiteSettings>(
  {
    projectName: { type: String, default: 'SHIVANTA HOMES' },
    tagline: { type: String, default: 'SHIVANTA HOMES' },
    phone: { type: String, default: '+91 9104717214' },
    whatsapp: { type: String, default: '919104717214' },
    email: { type: String, default: '' },
    address: { type: String, default: 'Chavaj Chokdi, Opp. Dharm Nandan, Chavaj, Bharuch, Gujarat' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    mapsLink: { type: String, default: 'https://maps.google.com/?q=Chavaj,+Bharuch,+Gujarat' },
    footerText: { type: String, default: 'Spacious 3 BHK luxurious row houses at Chavaj, Bharuch.' },
    copyright: { type: String, default: `© ${new Date().getFullYear()} Shivanta Homes. All rights reserved.` },
  },
  { timestamps: true }
);
export const SiteSettings = model<ISiteSettings>('SiteSettings', settingsSchema);

/* ------------------------------- SeoSettings ------------------------------ */
export interface ISeoSettings extends Document<Types.ObjectId> {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage: string;
  index: boolean;
  structuredData: Record<string, unknown>;
  updatedAt: Date;
}
const seoSchema = new Schema<ISeoSettings>(
  {
    title: { type: String, default: 'Shivanta Homes | Spacious 3 BHK Row Houses in Chavaj, Bharuch' },
    description: { type: String, default: 'Shivanta Homes — spacious 3 BHK luxurious row houses at Chavaj Chokdi, Bharuch — SHIVANTA HOMES.' },
    keywords: { type: String, default: 'Shivanta Homes, 3 BHK Bharuch, row houses Chavaj, houses in Bharuch, real estate Bharuch' },
    canonical: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    index: { type: Boolean, default: true },
    structuredData: { type: Object, default: {} },
  },
  { timestamps: true }
);
export const SeoSettings = model<ISeoSettings>('SeoSettings', seoSchema);
