/**
 * SHIVANTA HOMES — database seed.
 * Creates the first admin (from env), stores optimized copies of the supplied
 * project assets, generates the brochure PDF and seeds verified content only.
 * Safe to re-run (idempotent upserts).
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { MEDIA_DIR } from '../services/storage';
import { Admin } from '../models/Admin';
import {
  Hero, ProjectOverview, Residence, Amenity, GalleryItem, FloorPlan,
  Specification, ProjectLocation, Brochure, SiteSettings, SeoSettings,
} from '../models/content';

const ASSETS_DIR = process.env.SEED_ASSETS_DIR || path.join(process.cwd(), '..', 'uploads');

interface AssetSpec { src: string; out: string; width?: number }
const ASSETS: AssetSpec[] = [
  { src: 'view 01.png', out: 'entrance.jpg', width: 2200 },
  { src: 'render_3.png', out: 'garden-1.jpg', width: 2200 },
  { src: 'render_5.png', out: 'garden-2.jpg', width: 2200 },
  { src: 'phto1.png', out: 'layout.jpg', width: 1800 },
  { src: 'plan.png', out: 'floor-plan-3bhk.jpg', width: 1800 },
  { src: 'phto5.jpeg', out: 'poster.jpg', width: 1400 },
  { src: 'phto.png', out: 'amenities-map.jpg', width: 1600 },
  { src: 'shivantahomes Logo.png', out: 'logo.png', width: 900 },
  { src: 'A.jpg.jpeg', out: 'mark.jpg', width: 900 },
];

async function optimizeAssets() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const sharpMod = await import('sharp').catch(() => null);
  const sharp = sharpMod?.default;
  for (const a of ASSETS) {
    const src = path.join(ASSETS_DIR, a.src);
    const dest = path.join(MEDIA_DIR, a.out);
    if (!fs.existsSync(src)) { console.warn(`[seed] missing asset ${a.src} — skipped`); continue; }
    if (fs.existsSync(dest)) continue;
    if (sharp && a.out.endsWith('.jpg')) {
      await sharp(src).resize({ width: a.width, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(dest);
    } else if (sharp && a.out.endsWith('.png')) {
      await sharp(src).resize({ width: a.width, withoutEnlargement: true }).png().toFile(dest);
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`[seed] media ready: ${a.out}`);
  }
}

function generateBrochure(dest: string) {
  if (fs.existsSync(dest)) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 54 });
  doc.pipe(fs.createWriteStream(dest));
  const copper = '#9c7060';
  doc.rect(0, 0, doc.page.width, 90).fill(copper);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text('SHIVANTA HOMES', 54, 30);
  doc.fontSize(11).font('Helvetica').text('SHIVANTA HOMES — Spacious 3 BHK Luxurious Homes @ Chavaj, Bharuch', 54, 62);
  doc.moveDown(2);
  doc.fillColor('#222222').fontSize(14).font('Helvetica-Bold').text('The Project');
  doc.font('Helvetica').fontSize(10.5).moveDown(0.4);
  doc.text(
    'Shivanta Homes is a gated township of spacious 3 BHK luxurious row houses at Chavaj Chokdi, opposite Dharm Nandan, Bharuch. Every home sits on a 20 ft × 40 ft plot with a front-side balcony, private parking and an otta, surrounded by a landscaped central garden, RCC roads and a full compound wall.'
  );
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).text('3 BHK Residence — Ground Floor');
  doc.font('Helvetica').fontSize(10.5).moveDown(0.4);
  [
    "Living Room  11'-4\" × 13'-0\"",
    "Kitchen  9'-4\" × 10'-6\"",
    "Bedroom  9'-6\" × 10'-6\"",
    "Wash Area  19'-3\" × 4'-0\"",
    "Guest Toilet  4'-2\" × 6'-9\"",
    "Otta  8'-0\" × 4'-6\"",
    "Parking  7'-6\" × 11'-0\"",
  ].forEach((l) => doc.text(`•  ${l}`));
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).text('Amenities');
  doc.font('Helvetica').fontSize(10.5).moveDown(0.4);
  doc.text(
    'Entrance Gate • Security Cabin • CCTV Cameras • Borewell • Street Lights • Garden • Community Hall • Senior Citizen Seating • Front-Side Balcony • RCC Roads • China Mosaic Design • Compound Wall'
  );
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).text('Site Address & Contact');
  doc.font('Helvetica').fontSize(10.5).moveDown(0.4);
  doc.text('Chavaj Chokdi, Opp. Dharm Nandan, Chavaj, Bharuch, Gujarat');
  doc.text('Phone / WhatsApp: +91 91047 17214');
  doc.end();
}

async function upsertSingleton(Model: any, data: Record<string, unknown>, label: string) {
  await Model.findOneAndUpdate({}, data, { upsert: true, setDefaultsOnInsert: true });
  console.log(`[seed] ${label} seeded`);
}

export async function runSeed() {
  /* 1 — First admin from environment (never hardcoded in the frontend) */
  const email = env.ADMIN_EMAIL.toLowerCase();
  let admin = await Admin.findOne({ email });
  if (!admin) {
    admin = await Admin.create({
      name: env.ADMIN_NAME,
      email,
      passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
      role: 'superadmin',
    });
    console.log(`[seed] admin created: ${email}`);
  } else {
    console.log(`[seed] admin exists: ${email}`);
  }

  /* 2 — Media assets + brochure */
  await optimizeAssets();
  generateBrochure(path.join(MEDIA_DIR, 'shivanta-3bhk-brochure.pdf'));
  console.log('[seed] brochure PDF ready');

  /* 3 — Singleton content */
  await upsertSingleton(Hero, {
    label: '',
    heading: '',
    description: '',
    primaryCta: { text: 'Book a Site Visit', href: '#contact' },
    secondaryCta: { text: 'Explore Residences', href: '#residences' },
    posterUrl: '/media/entrance.jpg',
    active: true,
  }, 'hero');

  await upsertSingleton(ProjectOverview, {
    heading: 'A township designed around your family',
    description:
      'Shivanta Homes brings together landscaped gardens, RCC internal roads, a full compound wall and round-the-clock security into one peaceful address at Chavaj, Bharuch. Every row house is planned with a front-side balcony, private parking and an otta — spaces that make everyday life feel generous.',
    highlights: [
      'Gated township at Chavaj Chokdi, Bharuch',
      'Landscaped central garden with senior citizen seating',
      'RCC roads, china mosaic design & compound wall',
      'Entrance gate, security cabin & CCTV surveillance',
      'Community hall for celebrations and gatherings',
      'Front-side balcony, otta & parking with every home',
    ],
    stats: [
      { value: '3 BHK', label: 'Spacious Row Houses' },
      { value: "20'×40'", label: 'Plot Size' },
      { value: '12+', label: 'Amenities' },
      { value: 'RCC', label: 'Internal Roads' },
    ],
    images: ['/media/garden-1.jpg', '/media/entrance.jpg', '/media/garden-2.jpg'],
    active: true,
  }, 'project overview');

  await upsertSingleton(ProjectLocation, {
    address: 'Chavaj Chokdi, Opp. Dharm Nandan, Chavaj, Bharuch, Gujarat',
    lat: 21.7051,
    lng: 72.9756,
    mapsLink: 'https://maps.google.com/?q=Chavaj+Chokdi,+Bharuch,+Gujarat',
    embedUrl: 'https://www.google.com/maps?q=Chavaj%20Chokdi%2C%20Bharuch%2C%20Gujarat&output=embed',
    landmarks: [
      { name: 'Chavaj Chokdi', distance: 'At the township' },
      { name: 'Dharm Nandan', distance: 'Opposite side' },
    ],
    active: true,
  }, 'location');

  await upsertSingleton(Brochure, {
    title: 'SHIVANTA HOMES — 3 BHK Brochure',
    fileUrl: '/media/shivanta-3bhk-brochure.pdf',
    previewImage: '/media/floor-plan-3bhk.jpg',
    version: '1.0',
    active: true,
    uploadedAt: new Date(),
  }, 'brochure');

  await upsertSingleton(SiteSettings, {
    projectName: 'SHIVANTA HOMES',
    tagline: 'SHIVANTA HOMES',
    phone: '+91 9104717214',
    whatsapp: '919104717214',
    email: '',
    address: 'Chavaj Chokdi, Opp. Dharm Nandan, Chavaj, Bharuch, Gujarat',
    instagram: '',
    facebook: '',
    mapsLink: 'https://maps.google.com/?q=Chavaj+Chokdi,+Bharuch,+Gujarat',
    footerText: 'Spacious 3 BHK luxurious row houses at Chavaj, Bharuch — SHIVANTA HOMES.',
    copyright: `© ${new Date().getFullYear()} Shivanta Homes. All rights reserved.`,
  }, 'settings');

  await upsertSingleton(SeoSettings, {
    title: 'Shivanta Homes | Spacious 3 BHK Row Houses in Chavaj, Bharuch',
    description:
      'Shivanta Homes — spacious 3 BHK luxurious row houses on 20×40 plots at Chavaj Chokdi, Bharuch. Gated township, landscaped garden, RCC roads & 12+ amenities. SHIVANTA HOMES.',
    keywords: 'Shivanta Homes, 3 BHK Bharuch, row houses Chavaj, houses in Bharuch, real estate Bharuch, Chavaj township',
    canonical: '',
    ogImage: '/media/entrance.jpg',
    index: true,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: 'Shivanta Homes',
      description: 'Spacious 3 BHK luxurious row houses at Chavaj, Bharuch',
      address: { '@type': 'PostalAddress', addressLocality: 'Bharuch', addressRegion: 'Gujarat', country: 'IN' },
    },
  }, 'seo');

  /* 4 — Collections (only when empty, so admin edits are never overwritten) */
  if ((await Residence.countDocuments()) === 0) {
    await Residence.create({
      title: 'Spacious 3 BHK Row House',
      subtitle: "20' × 40' plot • Luxurious homes",
      description:
        'A ground-floor plan that wastes nothing: a wide living room, an efficient kitchen with wash area, a comfortable bedroom, guest toilet, plus an otta to enjoy evenings and parking for your family.',
      features: [
        "Living Room 11'4\" × 13'0\"",
        "Kitchen 9'4\" × 10'6\"",
        "Bedroom 9'6\" × 10'6\"",
        "Wash Area 19'3\" × 4'0\"",
        "Guest Toilet 4'2\" × 6'9\"",
        "Otta 8'0\" × 4'6\"",
        "Parking 7'6\" × 11'0\"",
        'Front-side balcony',
      ],
      images: ['/media/entrance.jpg', '/media/floor-plan-3bhk.jpg'],
      videoUrl: '',
      active: true,
      order: 1,
    });
    console.log('[seed] residences seeded');
  }

  if ((await Amenity.countDocuments()) === 0) {
    const amenities: [string, string, string][] = [
      ['Entrance Gate', 'A grand gated entry that welcomes you home.', 'gate'],
      ['Security Cabin', 'Manned security at the entrance for peace of mind.', 'security'],
      ['CCTV Cameras', 'Surveillance across the township for safety.', 'cctv'],
      ['Borewell', 'Assured water supply with dedicated borewell.', 'borewell'],
      ['Street Lights', 'Well-lit internal roads for safe evenings.', 'streetlight'],
      ['Garden', 'Landscaped central garden for every generation.', 'garden'],
      ['Community Hall', 'A shared space for celebrations and gatherings.', 'hall'],
      ['Senior Citizen Seating', 'Comfortable seating corners in the garden.', 'seating'],
      ['Front-Side Balcony', 'Every home opens to a private front balcony.', 'balcony'],
      ['RCC Roads', 'Durable RCC internal roads throughout.', 'road'],
      ['China Mosaic Design', 'Finished walkways with china mosaic detailing.', 'mosaic'],
      ['Compound Wall', 'A full compound wall secures the township.', 'wall'],
    ];
    await Amenity.insertMany(amenities.map(([name, description, icon], i) => ({ name, description, icon, active: true, order: i + 1 })));
    console.log('[seed] amenities seeded');
  }

  if ((await GalleryItem.countDocuments()) === 0) {
    await GalleryItem.insertMany([
      { title: 'Entrance Gate', alt: 'Shivanta Homes entrance gate render', url: '/media/entrance.jpg', category: 'Architecture', featured: true, active: true, order: 1 },
      { title: 'Central Garden', alt: 'Landscaped central garden with seating', url: '/media/garden-1.jpg', category: 'Garden', featured: true, active: true, order: 2 },
      { title: 'Garden Evenings', alt: 'Families enjoying the garden lawn', url: '/media/garden-2.jpg', category: 'Garden', featured: false, active: true, order: 3 },
      { title: 'Master Layout', alt: 'Shivanta Homes township layout plan', url: '/media/layout.jpg', category: 'Plans', featured: false, active: true, order: 4 },
      { title: '3 BHK Floor Plan', alt: '3 BHK ground floor plan 20 by 40', url: '/media/floor-plan-3bhk.jpg', category: 'Plans', featured: true, active: true, order: 5 },
      { title: 'Launch Poster', alt: 'Shivanta Homes 3 BHK launch poster', url: '/media/poster.jpg', category: 'Lifestyle', featured: false, active: true, order: 6 },
      { title: 'Amenities Overview', alt: 'Amenities chart of Shivanta Homes', url: '/media/amenities-map.jpg', category: 'Lifestyle', featured: false, active: true, order: 7 },
    ]);
    console.log('[seed] gallery seeded');
  }

  if ((await FloorPlan.countDocuments()) === 0) {
    await FloorPlan.create({
      title: '3 BHK — Ground Floor Plan',
      image: '/media/floor-plan-3bhk.jpg',
      propertyType: '3 BHK Row House',
      plotSize: "20' × 40'",
      description:
        "Ground floor plan on a 20' × 40' plot: living room, kitchen with wash area, bedroom, guest toilet, otta and private parking.",
      downloadUrl: '/media/shivanta-3bhk-brochure.pdf',
      active: true,
      order: 1,
    });
    console.log('[seed] floor plans seeded');
  }

  if ((await Specification.countDocuments()) === 0) {
    const specs: [string, string, string, string][] = [
      ['Structure', 'RCC Framed Structure', 'Earthquake-resistant RCC frame structure with quality masonry work.', 'structure'],
      ['Electrification', 'Concealed Electrification', 'Concealed copper wiring with modular switches and MCB protection.', 'electric'],
      ['Flooring', 'Vitrified Flooring', 'Premium vitrified tile flooring in living areas and bedrooms.', 'flooring'],
      ['Doors', 'Decorative Doors', 'Decorative main door with quality hardware; flush doors for rooms.', 'door'],
      ['Windows', 'Aluminium Windows', 'Aluminium windows with provision for mosquito net and grills.', 'window'],
      ['Wall Finish', 'Smooth Wall Finish', 'Internal putty finish; weather-resistant external paint.', 'wall'],
      ['Toilet and Plumbing', 'Plumbing & Sanitation', 'Quality CP fittings with concealed plumbing and water provision.', 'plumbing'],
      ['Kitchen', 'Functional Kitchen', 'Kitchen platform with stainless steel sink and utility space.', 'kitchen'],
    ];
    await Specification.insertMany(specs.map(([category, title, description, icon], i) => ({ category, title, description, icon, active: true, order: i + 1 })));
    console.log('[seed] specifications seeded');
  }

  console.log('✅ Seed complete');
}

async function main() {
  await connectDB();
  await runSeed();
  await disconnectDB();
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
