import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';

export const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');

export const cloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export interface StoredFile {
  url: string;
  publicId: string | null;
  provider: 'cloudinary' | 'local';
}

const extFor: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
};

/**
 * Stores a file buffer. Uses Cloudinary when configured (with automatic
 * optimization transformations), otherwise falls back to optimized local
 * storage served from /media.
 */
export async function storeBuffer(
  buffer: Buffer,
  mime: string,
  kind: 'image' | 'video' | 'document'
): Promise<StoredFile> {
  const ext = extFor[mime] || 'bin';
  const base = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  if (cloudinaryEnabled) {
    const resourceType = kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'raw';
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'shivanta-homes',
          ...(kind === 'image'
            ? { transformation: [{ fetch_format: 'auto', quality: 'auto' }, { width: 2200, crop: 'limit' }] }
            : {}),
        },
        (err, res) => (err || !res ? reject(err ?? new Error('Cloudinary upload failed')) : resolve(res))
      );
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' };
  }

  // Local fallback — images are optimized with sharp when available.
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  let out = buffer;
  let outExt = ext;
  if (kind === 'image') {
    try {
      const sharp = (await import('sharp')).default;
      out = await sharp(buffer)
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      outExt = 'jpg';
    } catch {
      // keep original buffer if sharp fails
    }
  }
  const name = `${base}.${outExt}`;
  fs.writeFileSync(path.join(MEDIA_DIR, name), out);
  return { url: `/media/${name}`, publicId: null, provider: 'local' };
}

export async function removeStored(publicId: string | null, url: string): Promise<void> {
  try {
    if (publicId && cloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => undefined);
      return;
    }
    if (url.startsWith('/media/')) {
      const file = path.join(MEDIA_DIR, path.basename(url));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  } catch (err) {
    console.error('[storage] failed to remove stored file', err);
  }
}
