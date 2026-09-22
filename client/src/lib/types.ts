export interface Cta { text: string; href: string }
export interface Hero { label: string; heading: string; description: string; primaryCta: Cta; secondaryCta: Cta; videoUrl: string; posterUrl: string; active: boolean }
export interface Overview { heading: string; description: string; highlights: string[]; stats: { value: string; label: string }[]; images: string[]; active: boolean }
export interface Residence { _id?: string; title: string; subtitle: string; description: string; features: string[]; images: string[]; videoUrl: string; active: boolean; order?: number }
export interface Amenity { _id?: string; name: string; description: string; icon: string; image?: string; active: boolean; order?: number }
export interface GalleryItem { _id?: string; title: string; alt: string; url: string; category: string; featured: boolean; active: boolean; order?: number }
export interface ProjectVideo { _id?: string; title: string; url: string; poster: string; type: string; active: boolean; order?: number }
export interface FloorPlan { _id?: string; title: string; image: string; propertyType: string; plotSize: string; description: string; downloadUrl: string; active: boolean; order?: number }
export interface Specification { _id?: string; category: string; title: string; description: string; icon: string; active: boolean; order?: number }
export interface LocationInfo { address: string; lat: number; lng: number; mapsLink: string; embedUrl: string; landmarks: { name: string; distance: string }[]; active: boolean }
export interface Brochure { title: string; fileUrl: string; previewImage: string; version: string; active: boolean; uploadedAt?: string }
export interface Settings { projectName: string; tagline: string; phone: string; whatsapp: string; email: string; address: string; instagram: string; facebook: string; mapsLink: string; footerText: string; copyright: string }
export interface Seo { title: string; description: string; keywords: string; canonical: string; ogImage: string; index: boolean; structuredData: Record<string, unknown> }
export interface Enquiry {
  _id: string; fullName: string; mobile: string; email: string; enquiryType: string;
  preferredVisitDate: string | null; message: string; status: string;
  notes: { text: string; createdBy: string; createdAt: string }[]; source: string; createdAt: string; updatedAt: string;
}
export interface SiteVisit {
  _id: string; customerName: string; phone: string; email: string; visitDate: string; visitTime: string;
  visitors: number; interest: string; notes: string; status: string; enquiry?: { _id: string; fullName: string; enquiryType: string } | null; createdAt: string;
}
export interface MediaItem { _id: string; title: string; url: string; resourceType: string; format: string; size: number; category: string; createdAt: string }
export interface AdminUser { id: string; name: string; email: string; role: string; lastLoginAt: string | null }
