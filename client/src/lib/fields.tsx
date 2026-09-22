import React, { useRef, useState } from 'react';
import api from './api';
import { Icon } from './icons';
import { useToast } from './ui';

export function Field({ label, children, error, full, help }: { label: string; children: React.ReactNode; error?: string; full?: boolean; help?: string }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
      {help && <small style={{ color: 'var(--muted)' }}>{help}</small>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export async function uploadFiles(files: File[], category = 'Other', onProgress?: (pct: number) => void) {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  fd.append('category', category);
  const { data } = await api.post('/media/upload', fd, {
    onUploadProgress: (e) => onProgress?.(Math.round(((e.loaded ?? 0) / (e.total ?? 1)) * 100)),
  });
  return data.items as { url: string; _id: string; resourceType: string }[];
}

/* ------------------------------ Image picker ----------------------------- */
export function ImagePicker({ value, onChange, label = 'Upload image' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const items = await uploadFiles([files[0]], 'Other');
      onChange(items[0].url);
      toast('Image uploaded');
    } catch (e: any) {
      toast(e.response?.data?.message ?? 'Upload failed', 'red');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="img-pick">
      {value ? <img className="thumb" src={value} alt="" /> : <div className="ph"><Icon name="image" size={22} /></div>}
      <div className="acts">
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => ref.current?.click()}>
            <Icon name="upload" size={14} /> {busy ? 'Uploading…' : label}
          </button>
          {value && (
            <button type="button" className="mini-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(value.startsWith('http') ? value : window.location.origin + value); toast('URL copied'); }}>
              <Icon name="copy" size={14} />
            </button>
          )}
          {value && (
            <button type="button" className="mini-btn danger" title="Remove" onClick={() => onChange('')}>
              <Icon name="trash" size={14} />
            </button>
          )}
        </div>
        <input className="input" style={{ padding: '8px 10px', fontSize: 12, width: 260 }} placeholder="…or paste an image URL" value={value} onChange={(e) => onChange(e.target.value)} />
        {value && <span className="url">{value}</span>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

/* --------------------------- Multi image picker -------------------------- */
export function MultiImagePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const items = await uploadFiles(Array.from(files), 'Other');
      onChange([...value, ...items.map((i) => i.url)]);
      toast(`${items.length} image(s) uploaded`);
    } catch (e: any) {
      toast(e.response?.data?.message ?? 'Upload failed', 'red');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {value.map((url, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={url} alt="" style={{ width: 92, height: 66, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
            <button type="button" className="mini-btn danger" style={{ position: 'absolute', top: -8, right: -8, background: '#fff' }} onClick={() => onChange(value.filter((_, x) => x !== i))}>
              <Icon name="close" size={12} />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => ref.current?.click()}>
          <Icon name="upload" size={14} /> {busy ? 'Uploading…' : 'Add images'}
        </button>
      </div>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

/* ------------------------------ File picker ------------------------------ */
export function FilePicker({ value, onChange, accept, label }: { value: string; onChange: (v: string) => void; accept: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const items = await uploadFiles([files[0]], 'Documents');
      onChange(items[0].url);
      toast('File uploaded');
    } catch (e: any) {
      toast(e.response?.data?.message ?? 'Upload failed', 'red');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="img-pick">
      <div className={value ? 'thumb' : 'ph'} style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        {value ? <Icon name="check" size={20} /> : <Icon name="file" size={20} />}
      </div>
      <div className="acts">
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => ref.current?.click()}>
          <Icon name="upload" size={14} /> {busy ? 'Uploading…' : label}
        </button>
        {value && <span className="url">{value}</span>}
        {value && <button type="button" className="mini-btn danger" onClick={() => onChange('')}><Icon name="trash" size={14} /></button>}
      </div>
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

/* ------------------------------ Strings editor ---------------------------- */
export function StringsEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const list = value.length ? value : [''];
  const set = (i: number, v: string) => onChange(list.map((x, xi) => (xi === i ? v : x)).filter((x) => x !== ''));
  return (
    <div className="strings-editor">
      {list.map((s, i) => (
        <div className="row" key={i}>
          <input className="input" value={s} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} />
          <button type="button" className="mini-btn danger" onClick={() => onChange(list.filter((_, x) => x !== i).filter((x) => x !== ''))}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" style={{ justifySelf: 'start' }} onClick={() => onChange([...list.filter((x) => x !== ''), ''])}>
        <Icon name="plus" size={14} /> Add item
      </button>
    </div>
  );
}

/* ------------------------- Pairs editor (stats etc.) ---------------------- */
export function PairsEditor({ value, onChange, firstLabel, secondLabel }: { value: { a: string; b: string }[]; onChange: (v: { a: string; b: string }[]) => void; firstLabel: string; secondLabel: string }) {
  const list = value.length ? value : [{ a: '', b: '' }];
  const set = (i: number, patch: Partial<{ a: string; b: string }>) => onChange(list.map((x, xi) => (xi === i ? { ...x, ...patch } : x)));
  return (
    <div className="strings-editor">
      {list.map((p, i) => (
        <div className="row" key={i}>
          <input className="input" placeholder={firstLabel} value={p.a} onChange={(e) => set(i, { a: e.target.value })} />
          <input className="input" placeholder={secondLabel} value={p.b} onChange={(e) => set(i, { b: e.target.value })} />
          <button type="button" className="mini-btn danger" onClick={() => onChange(list.filter((_, x) => x !== i))}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" style={{ justifySelf: 'start' }} onClick={() => onChange([...list, { a: '', b: '' }])}>
        <Icon name="plus" size={14} /> Add row
      </button>
    </div>
  );
}
