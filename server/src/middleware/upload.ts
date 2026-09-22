import multer from 'multer';
import { ApiError } from '../utils/ApiError';

export const ALLOWED_MIMES: Record<string, 'image' | 'video' | 'document'> = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/avif': 'image',
  'video/mp4': 'video',
  'application/pdf': 'document',
};

const IMAGE_MAX = 12 * 1024 * 1024; // 12 MB
const VIDEO_MAX = 200 * 1024 * 1024; // 200 MB
const PDF_MAX = 30 * 1024 * 1024; // 30 MB

export function maxFor(mime: string): number {
  const kind = ALLOWED_MIMES[mime];
  if (kind === 'video') return VIDEO_MAX;
  if (kind === 'document') return PDF_MAX;
  return IMAGE_MAX;
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed: JPG, JPEG, PNG, WebP, AVIF, MP4, PDF.`));
    }
    cb(null, true);
  },
});
