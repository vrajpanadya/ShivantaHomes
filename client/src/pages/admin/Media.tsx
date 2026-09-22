import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import { Empty, Modal, Pager, Skeleton, useConfirm, useToast, fmtBytes, fmtDate } from '../../lib/ui';
import { Icon } from '../../lib/icons';
import { Field, uploadFiles } from '../../lib/fields';
import type { MediaItem } from '../../lib/types';

const CATS = ['Architecture', 'Lifestyle', 'Garden', 'Streetscape', 'Evening Views', 'Plans', 'Documents', 'Other'];

export default function Media() {
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState({ search: '', category: '', type: '' });
  const [progress, setProgress] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [form, setForm] = useState({ title: '', category: 'Other' });

  const load = useCallback(() => {
    setItems(null);
    api.get('/media', { params: { page, limit: 12, ...Object.fromEntries(Object.entries(q).filter(([, v]) => v)) } })
      .then(({ data }) => { setItems(data.items); setTotalPages(data.pagination.totalPages); setTotal(data.pagination.total); })
      .catch(() => setItems([]));
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const upload = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setProgress(0);
    try {
      await uploadFiles(arr, 'Other', setProgress);
      toast(`${arr.length} file(s) uploaded`);
      load();
    } catch (e: any) {
      toast(e.response?.data?.message ?? 'Upload failed', 'red');
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (m: MediaItem) => {
    const ok = await confirm({ title: 'Delete media', message: `Delete "${m.title || m.url}" from the library?`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/media/${m._id}`);
      toast('Media deleted');
      load();
    } catch (e: any) {
      if (e.response?.status === 409) {
        const usage = e.response.data.details?.usage ?? [];
        const force = await confirm({
          title: 'Media is in use',
          message: `This file is currently used by: ${usage.join(', ')}. Force delete anyway? The website section may show a missing image.`,
          confirmText: 'Force Delete',
          danger: true,
        });
        if (force) {
          await api.delete(`/media/${m._id}?force=true`);
          toast('Media force-deleted', 'amber');
          load();
        }
      } else {
        toast(e.response?.data?.message ?? 'Delete failed', 'red');
      }
    }
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url.startsWith('http') ? url : window.location.origin + url);
    toast('URL copied to clipboard');
  };

  const saveEdit = async () => {
    if (!editing) return;
    await api.patch(`/media/${editing._id}`, form);
    toast('Media updated');
    setEditing(null);
    load();
  };

  return (
    <>
      <div
        className={`dropzone ${over ? 'over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
      >
        <Icon name="upload" size={30} strokeWidth={1.4} />
        <p style={{ marginTop: 8, fontWeight: 700 }}>Drop files here or click to upload</p>
        <p style={{ fontSize: 12 }}>JPG • PNG • WebP • AVIF • MP4 • PDF — images are optimized automatically</p>
        {progress !== null && <div className="progress"><div style={{ width: `${progress}%` }} /></div>}
        <input ref={inputRef} type="file" multiple hidden accept=".jpg,.jpeg,.png,.webp,.avif,.mp4,.pdf" onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>

      <div className="toolbar">
        <div className="input grow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="search" size={15} style={{ color: 'var(--muted)' }} />
          <input style={{ border: 0, outline: 0, flex: 1, font: 'inherit', background: 'transparent' }} placeholder="Search media…" value={q.search} onChange={(e) => { setQ({ ...q, search: e.target.value }); setPage(1); }} />
        </div>
        <select className="select" value={q.category} onChange={(e) => { setQ({ ...q, category: e.target.value }); setPage(1); }}>
          <option value="">All categories</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="select" value={q.type} onChange={(e) => { setQ({ ...q, type: e.target.value }); setPage(1); }}>
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {items === null ? (
        <div className="media-grid">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={190} />)}</div>
      ) : items.length === 0 ? (
        <Empty icon="image" title="No media yet" message="Upload your first images, videos or PDFs above." />
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <div className="media-card" key={m._id}>
              <div className="prev">
                {m.resourceType === 'image' ? (
                  <img src={m.url} alt={m.title} loading="lazy" />
                ) : (
                  <Icon name={m.resourceType === 'video' ? 'video' : 'file'} size={34} strokeWidth={1.2} />
                )}
              </div>
              <div className="meta">
                <b>{m.title || m.url.split('/').pop()}</b>
                <span>{m.category} • {fmtBytes(m.size)} • {fmtDate(m.createdAt)}</span>
              </div>
              <div className="acts">
                <button className="mini-btn" title="Copy URL" onClick={() => copy(m.url)}><Icon name="copy" size={14} /></button>
                <a className="mini-btn" title="Open" href={m.url} target="_blank" rel="noreferrer"><Icon name="external" size={14} /></a>
                <button className="mini-btn" title="Edit" onClick={() => { setEditing(m); setForm({ title: m.title, category: m.category }); }}><Icon name="edit" size={14} /></button>
                <button className="mini-btn danger" title="Delete" onClick={() => remove(m)}><Icon name="trash" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="panel" style={{ marginTop: 14 }}>
        <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
      </div>

      {editing && (
        <Modal title="Edit media details" onClose={() => setEditing(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
          </>
        }>
          <Field label="Title"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Category">
            <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <p style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>{editing.url}</p>
        </Modal>
      )}
    </>
  );
}
