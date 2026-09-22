import { useEffect, useState } from 'react';
import api from './api';

const TTL = 5 * 60 * 1000;
const memCache = new Map<string, { t: number; data: unknown }>();
export function invalidatePublic(path?: string) {
  if (path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const key = `shc:${normalized}`;

    memCache.delete(key);

    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }

    return;
  }

  memCache.clear();

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('shc:'))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/** Fetch public content with a memory + localStorage cache (stable, no layout shift). */
export async function fetchPublic<T>(path: string, ttl = TTL): Promise<T | null> {
  const key = `shc:${path}`;
  const mem = memCache.get(key);
  if (mem && Date.now() - mem.t < ttl) return mem.data as T;
  try {
    const ls = localStorage.getItem(key);
    if (ls) {
      const parsed = JSON.parse(ls) as { t: number; data: T };
      if (Date.now() - parsed.t < ttl) {
        memCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const { data } = await api.get(path);
    const payload = { t: Date.now(), data: data.items ?? data.item ?? data };
    memCache.set(key, payload);
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      /* storage full */
    }
    return payload.data as T;
  } catch {
    return null;
  }
}

export function usePublic<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPublic<T>(path).then((d) => {
      if (!alive) return;
            const shapeOk = !Array.isArray(fallback) || Array.isArray(d);
      if (d !== null && d !== undefined && shapeOk) setData(d);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  return { data, loading };
}
