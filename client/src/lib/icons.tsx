import React from 'react';
import {
  // amenities
  DoorOpen, ShieldCheck, Cctv, Droplets, LampFloor, Trees, Landmark, Park, Fence, Road, LayoutGrid, BrickWall,
  // extra amenity choices for the CMS
  SquareParking, Dumbbell, Waves, Footprints, Wifi, Car, SunMedium, CloudRain, ToyBrick, PlugZap, FireExtinguisher,
  LandPlot, Bell, Droplet, PartyPopper, TreePine, Lock, Camera, Armchair, Flower2, Siren, BrickWallShield,
  // specifications
  Building2, Zap, Grid3x3, DoorClosed, Blinds, PaintRoller, ShowerHead, CookingPot, Hammer, Wrench, Ruler, Bath, Fan, Tv, Layers,
  // contact / UI
  Phone, Mail, MapPin, Calendar, Download, Upload, ArrowRight, Menu, X, Pencil, Trash2, Eye, Search, Plus,
  ChevronLeft, ChevronRight, ChevronDown, LogOut, LayoutDashboard, Users, Settings, List, GripVertical, Copy,
  ExternalLink, Check, TriangleAlert, Info, Map, Image, Video, FileText, House, Activity, SearchCheck,
  type LucideIcon, type LucideProps,
} from 'lucide-react';

/**
 * Icon registry — the string keys are what the CMS stores (amenity.icon, specification.icon).
 * Icons are the Lucide set (ISC licence); brand marks that Lucide does not ship are drawn below.
 */
const L: Record<string, LucideIcon> = {
  /* amenities (seeded order) */
  gate: DoorOpen,
  security: ShieldCheck,
  cctv: Cctv,
  borewell: Droplets,
  streetlight: LampFloor,
  garden: Trees,
  hall: Landmark,
  seating: Park,
  balcony: Fence,
  road: Road,
  mosaic: LayoutGrid,
  wall: BrickWall,
  /* more amenity choices */
  parking: SquareParking,
  gym: Dumbbell,
  pool: Waves,
  jogging: Footprints,
  wifi: Wifi,
  car: Car,
  solar: SunMedium,
  rainwater: CloudRain,
  playground: ToyBrick,
  powerbackup: PlugZap,
  firesafety: FireExtinguisher,
  plot: LandPlot,
  intercom: Bell,
  watertank: Droplet,
  clubhouse: PartyPopper,
  tree: TreePine,
  lock: Lock,
  camera: Camera,
  bench: Armchair,
  flower: Flower2,
  siren: Siren,
  securedwall: BrickWallShield,
  /* specifications */
  structure: Building2,
  electric: Zap,
  flooring: Grid3x3,
  door: DoorClosed,
  window: Blinds,
  wallfinish: PaintRoller,
  plumbing: ShowerHead,
  kitchen: CookingPot,
  hammer: Hammer,
  wrench: Wrench,
  ruler: Ruler,
  bath: Bath,
  fan: Fan,
  tv: Tv,
  layers: Layers,
  /* contact / UI */
  phone: Phone,
  mail: Mail,
  pin: MapPin,
  calendar: Calendar,
  download: Download,
  upload: Upload,
  arrow: ArrowRight,
  menu: Menu,
  close: X,
  edit: Pencil,
  trash: Trash2,
  eye: Eye,
  search: Search,
  plus: Plus,
  chevL: ChevronLeft,
  chevR: ChevronRight,
  chevD: ChevronDown,
  logout: LogOut,
  dashboard: LayoutDashboard,
  users: Users,
  settings: Settings,
  list: List,
  grid: LayoutGrid,
  drag: GripVertical,
  copy: Copy,
  external: ExternalLink,
  check: Check,
  warning: TriangleAlert,
  info: Info,
  map: Map,
  image: Image,
  video: Video,
  file: FileText,
  home: House,
  activity: Activity,
  seo: SearchCheck,
};

/* Brand marks (Lucide ships no brand icons) — same 24×24 stroke style. */
const BRAND: Record<string, React.ReactNode> = {
  whatsapp: <><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z" /><path d="M9 8.5c-.5 2.5 3.5 6.5 6 6l.5-2-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2-1 1.5z" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" /></>,
  facebook: <><path d="M14 8h3V4h-3a5 5 0 00-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9a1 1 0 011-1z" /></>,
};

type Props = { name: string; size?: number; strokeWidth?: number } & Omit<LucideProps, 'size' | 'strokeWidth' | 'ref'>;

export function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }: Props) {
  const brand = BRAND[name];
  if (brand) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...(rest as React.SVGAttributes<SVGSVGElement>)}>
        {brand}
      </svg>
    );
  }
  const C = L[name] ?? Info;
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}

export const ICON_KEYS = [...Object.keys(L), ...Object.keys(BRAND)];
