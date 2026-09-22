import type { Hero, Overview, Settings, Seo, LocationInfo, Brochure } from './types';

/** Safe fallback content so the public site always renders, even if the API is unreachable. */
export const FALLBACK = {
  hero: {
    label: '',
    heading: '',
    description: '',
    primaryCta: { text: 'Book a Site Visit', href: '#contact' },
    secondaryCta: { text: 'Explore Residences', href: '#residences' },
    videoUrl: '',
    posterUrl: '/media/entrance.jpg',
    active: true,
  } as Hero,
  overview: {
    heading: 'A township designed around your family',
    description: 'Shivanta Homes brings together landscaped gardens, RCC internal roads, a full compound wall and round-the-clock security into one peaceful address at Chavaj, Bharuch.',
    highlights: [
      'Gated township at Chavaj Chokdi, Bharuch',
      'Landscaped central garden with senior citizen seating',
      'RCC roads, china mosaic design & compound wall',
      'Entrance gate, security cabin & CCTV surveillance',
    ],
    stats: [
      { value: '3 BHK', label: 'Spacious Row Houses' },
      { value: "20'×40'", label: 'Plot Size' },
      { value: '12+', label: 'Amenities' },
      { value: 'RCC', label: 'Internal Roads' },
    ],
    images: ['/media/garden-1.jpg', '/media/entrance.jpg'],
    active: true,
  } as Overview,
  settings: {
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
  } as Settings,
  seo: {
    title: 'Shivanta Homes | Spacious 3 BHK Row Houses in Chavaj, Bharuch',
    description: 'Shivanta Homes — spacious 3 BHK luxurious row houses on 20×40 plots at Chavaj Chokdi, Bharuch.',
    keywords: 'Shivanta Homes, 3 BHK Bharuch, row houses Chavaj',
    canonical: '',
    ogImage: '/media/entrance.jpg',
    index: true,
    structuredData: {},
  } as Seo,
  location: {
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
  } as LocationInfo,
  brochure: {
    title: 'SHIVANTA HOMES — 3 BHK Brochure',
    fileUrl: '/media/shivanta-3bhk-brochure.pdf',
    previewImage: '/media/floor-plan-3bhk.jpg',
    version: '1.0',
    active: true,
  } as Brochure,
};
