import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import { Badge, Empty, Modal, Pager, Skeleton, Toggle, useConfirm, useToast } from '../../lib/ui';
import { Icon, ICON_KEYS } from '../../lib/icons';
import { Field, ImagePicker, MultiImagePicker, FilePicker, StringsEditor, PairsEditor } from '../../lib/fields';
import { invalidatePublic } from '../../lib/usePublic';
/* ------------------------------ field schema ----------------------------- */
export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'image' | 'images' | 'strings' | 'pairs' | 'file' | 'icon' | 'json' | 'date';
  options?: string[];
  accept?: string;
  full?: boolean;
  help?: string;
  pairLabels?: [string, string];
}

const get = (obj: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const setPath = (obj: any, path: string, value: unknown) => {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
};

function FieldControl({ fd, value, onChange }: { fd: FieldDef; value: any; onChange: (v: any) => void }) {
  switch (fd.type) {
    case 'textarea': return <textarea className="textarea" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number': return <input className="input" type="number" step="any" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} />;
    case 'date': return <input className="input" type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select': return <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{(fd.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>;
    case 'toggle': return <div><Toggle on={!!value} onChange={onChange} label={fd.label} /></div>;
    case 'image': return <ImagePicker value={value ?? ''} onChange={onChange} />;
    case 'images': return <MultiImagePicker value={value ?? []} onChange={onChange} />;
    case 'strings': return <StringsEditor value={value ?? []} onChange={onChange} />;
    case 'pairs': return <PairsEditor value={(value ?? []).map((p: any) => ({ a: p.value ?? p.name ?? '', b: p.label ?? p.distance ?? '' }))} onChange={(rows) => onChange(rows.map((r) => pairOut(fd, r)))} firstLabel={fd.pairLabels?.[0] ?? 'Value'} secondLabel={fd.pairLabels?.[1] ?? 'Label'} />;
    case 'file': return <FilePicker value={value ?? ''} onChange={onChange} accept={fd.accept ?? '*'} label={`Upload ${fd.label.toLowerCase()}`} />;
    case 'icon': return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="amenity-icon" style={{ margin: 0 }}><Icon name={value || 'info'} size={20} /></span>
        <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{ICON_KEYS.map((k) => <option key={k}>{k}</option>)}</select>
      </div>
    );
    case 'json': return <textarea className="textarea" style={{ fontFamily: 'monospace', fontSize: 12 }} value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(e) => onChange(e.target.value)} />;
    default: return <input className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

function pairOut(fd: FieldDef, r: { a: string; b: string }) {
  if (fd.name === 'landmarks') return { name: r.a, distance: r.b };
  return { value: r.a, label: r.b };
}

function FormFields({ fields, form, setForm }: { fields: FieldDef[]; form: any; setForm: (f: any) => void }) {
  return (
    <div className="form-grid">
      {fields.map((fd) => (
        <Field key={fd.name} label={fd.label} full={fd.full || ['textarea', 'image', 'images', 'strings', 'pairs', 'file', 'json'].includes(fd.type)} help={fd.help}>
          <FieldControl fd={fd} value={get(form, fd.name)} onChange={(v) => { const next = { ...form }; setPath(next, fd.name, v); setForm(next); }} />
        </Field>
      ))}
    </div>
  );
}

/* ------------------------------ manager page ----------------------------- */
interface Column { key: string; label: string; render?: (item: any) => React.ReactNode }

export function ManagerPage({ apiPath, fields, columns, defaults, title }: {
  apiPath: string; fields: FieldDef[]; columns: Column[]; defaults: Record<string, unknown>; title: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<any[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [modal, setModal] = useState<{ item: any; isNew: boolean } | null>(null);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const dragIdx = useRef<number | null>(null);

  const load = useCallback(() => {
    setItems(null);
    api.get(`/${apiPath}/list`, { params: { page, limit: 20, search, active } })
      .then(({ data }) => { setItems(data.items); setTotalPages(data.pagination.totalPages); setTotal(data.pagination.total); })
      .catch(() => setItems([]));
  }, [apiPath, page, search, active]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...defaults }); setModal({ item: null, isNew: true }); };
  const openEdit = (item: any) => { setForm(JSON.parse(JSON.stringify(item))); setModal({ item, isNew: false }); };

  const save = async () => {
    setBusy(true);
    try {
      const body: any = { ...form };
      fields.forEach((fd) => { if (fd.type === 'json' && typeof get(body, fd.name) === 'string') { try { setPath(body, fd.name, JSON.parse(get(body, fd.name) || '{}')); } catch { throw new Error(`${fd.label} must be valid JSON`); } } });
      delete body._id; delete body.createdAt; delete body.updatedAt; delete body.__v;
      if (modal?.isNew) await api.post(`/${apiPath}`, body);
      else await api.put(`/${apiPath}/${modal!.item._id}`, body);
      toast(modal?.isNew ? 'Created' : 'Saved');
      setModal(null);
      load();
    } catch (e: any) {
      toast(e.response?.data?.message ?? e.message ?? 'Save failed', 'red');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: any) => {
    const ok = await confirm({ title: 'Delete item', message: `Delete "${item.name ?? item.title}"? This cannot be undone.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    await api.delete(`/${apiPath}/${item._id}`);
    toast('Deleted');
    load();
  };

  const toggleActive = async (item: any) => {
    await api.put(`/${apiPath}/${item._id}`, { active: !item.active });
    load();
  };

  const reorder = async (from: number, to: number) => {
    if (!items || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    await api.put(`/${apiPath}/reorder`, { ids: next.map((i) => i._id) });
    toast('Display order updated');
  };

  return (
    <>
      <div className="toolbar">
        <div className="input grow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="search" size={15} style={{ color: 'var(--muted)' }} />
          <input style={{ border: 0, outline: 0, flex: 1, font: 'inherit', background: 'transparent' }} placeholder={`Search ${title.toLowerCase()}…`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="select" value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
          <option value="">All</option><option value="true">Active</option><option value="false">Hidden</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={openNew}><Icon name="plus" size={14} /> Add New</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th style={{ width: 34 }}></th>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th>Active</th><th style={{ width: 90 }}>Actions</th></tr>
            </thead>
            <tbody>
              {items?.map((item, i) => (
                <tr
                  key={item._id}
                  draggable
                  onDragStart={() => (dragIdx.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIdx.current !== null) reorder(dragIdx.current, i); dragIdx.current = null; }}
                >
                  <td className="drag-handle" title="Drag to reorder"><Icon name="drag" size={15} /></td>
                  {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : String(get(item, c.key) ?? '—')}</td>)}
                  <td><Toggle on={!!item.active} onChange={() => toggleActive(item)} label="active" /></td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" title="Edit" onClick={() => openEdit(item)}><Icon name="edit" size={14} /></button>
                      <button className="mini-btn danger" title="Delete" onClick={() => remove(item)}><Icon name="trash" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items === null && <div style={{ padding: 18, display: 'grid', gap: 10 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={44} />)}</div>}
          {items?.length === 0 && <Empty icon="info" title={`No ${title.toLowerCase()} yet`} message="Click “Add New” to create the first one." />}
        </div>
        <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
      </div>

      {modal && (
        <Modal title={modal.isNew ? `Add ${title}` : `Edit ${title}`} onClose={() => setModal(null)} wide footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
          </>
        }>
          <FormFields fields={fields} form={form} setForm={setForm} />
        </Modal>
      )}
    </>
  );
}

/* ------------------------------ singleton page ---------------------------- */
export function SingletonPage({ apiPath, fields, title }: { apiPath: string; fields: FieldDef[]; title: string }) {
  const toast = useToast();
  const [form, setForm] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/${apiPath}`).then(({ data }) => setForm(data.item ?? {})).catch(() => setForm({}));
  }, [apiPath]);

  const save = async () => {
    setBusy(true);
    try {
      const body: any = { ...form };
      fields.forEach((fd) => { if (fd.type === 'json' && typeof get(body, fd.name) === 'string') { try { setPath(body, fd.name, JSON.parse(get(body, fd.name) || '{}')); } catch { throw new Error(`${fd.label} must be valid JSON`); } } });
      delete body._id; delete body.createdAt; delete body.updatedAt; delete body.__v;
     const { data } = await api.put(`/${apiPath}`, body);

setForm(data.item);
invalidatePublic(`/${apiPath}`);

toast(`${title} saved — live on the website`);
    } catch (e: any) {
      toast(e.response?.data?.message ?? e.message ?? 'Save failed', 'red');
    } finally {
      setBusy(false);
    }
  };

  if (form === null) return <div style={{ display: 'grid', gap: 14 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={60} />)}</div>;

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Changes'}</button>
      </div>
      <div className="panel-body">
        <FormFields fields={fields} form={form} setForm={setForm} />
      </div>
    </div>
  );
}

/* ============================ MODULE PAGES ============================ */
export const HeroPage = () => (
  <SingletonPage apiPath="hero" title="Hero Section" fields={[
    { name: 'active', label: 'Hero Active', type: 'toggle' },
    { name: 'label', label: 'Small Label', type: 'text' },
    { name: 'heading', label: 'Main Heading', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'primaryCta.text', label: 'Primary CTA Text', type: 'text' },
    { name: 'primaryCta.href', label: 'Primary CTA Link', type: 'text', help: 'e.g. #contact' },
    { name: 'secondaryCta.text', label: 'Secondary CTA Text', type: 'text' },
    { name: 'secondaryCta.href', label: 'Secondary CTA Link', type: 'text' },
    { name: 'posterUrl', label: 'Poster / Background Image', type: 'image' },
    { name: 'videoUrl', label: 'Background Video (MP4, optional)', type: 'file', accept: 'video/mp4' },
  ]} />
);

export const OverviewPage = () => (
  <SingletonPage apiPath="project-overview" title="Project Overview" fields={[
    { name: 'active', label: 'Section Active', type: 'toggle' },
    { name: 'heading', label: 'Heading', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'highlights', label: 'Highlight Points', type: 'strings' },
    { name: 'stats', label: 'Statistics', type: 'pairs', pairLabels: ['Value (e.g. 3 BHK)', 'Label (e.g. Row Houses)'] },
    { name: 'images', label: 'Images', type: 'images' },
  ]} />
);

export const ResidencesPage = () => (
  <ManagerPage apiPath="residences" title="Residence" defaults={{ title: '', subtitle: '', description: '', features: [], images: [], videoUrl: '', active: true }} fields={[
    { name: 'title', label: 'Residence Title', type: 'text' },
    { name: 'subtitle', label: 'Subtitle', type: 'text' },
    { name: 'active', label: 'Active', type: 'toggle' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'features', label: 'Features', type: 'strings' },
    { name: 'images', label: 'Images', type: 'images' },
    { name: 'videoUrl', label: 'Video (MP4)', type: 'file', accept: 'video/mp4' },
  ]} columns={[
    { key: 'title', label: 'Title', render: (i) => <b>{i.title}</b> },
    { key: 'subtitle', label: 'Subtitle' },
  ]} />
);

export const AmenitiesPage = () => (
  <ManagerPage apiPath="amenities" title="Amenity" defaults={{ name: '', description: '', icon: 'gate', image: '', active: true }} fields={[
    { name: 'name', label: 'Amenity Name', type: 'text' },
    { name: 'icon', label: 'Icon', type: 'icon' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'image', label: 'Image (optional)', type: 'image' },
    { name: 'active', label: 'Active', type: 'toggle' },
  ]} columns={[
    { key: 'name', label: 'Name', render: (i) => <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="amenity-icon" style={{ margin: 0, width: 34, height: 34 }}><Icon name={i.icon} size={16} /></span><b>{i.name}</b></span> },
    { key: 'description', label: 'Description' },
  ]} />
);

export const GalleryPage = () => (
  <ManagerPage apiPath="gallery" title="Gallery Item" defaults={{ title: '', alt: '', url: '', category: 'Architecture', featured: false, active: true }} fields={[
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'category', label: 'Category', type: 'select', options: ['Architecture', 'Lifestyle', 'Garden', 'Streetscape', 'Evening Views', 'Plans'] },
    { name: 'alt', label: 'Alt Text', type: 'text' },
    { name: 'featured', label: 'Featured', type: 'toggle' },
    { name: 'url', label: 'Image', type: 'image' },
    { name: 'active', label: 'Active', type: 'toggle' },
  ]} columns={[
    { key: 'url', label: 'Image', render: (i) => <img src={i.url} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8 }} /> },
    { key: 'title', label: 'Title', render: (i) => <b>{i.title}</b> },
    { key: 'category', label: 'Category', render: (i) => <span className="badge copper">{i.category}</span> },
    { key: 'featured', label: 'Featured', render: (i) => (i.featured ? <Badge status="Active" /> : <span style={{ color: 'var(--muted)' }}>—</span>) },
  ]} />
);

export const VideosPage = () => (
  <ManagerPage apiPath="videos" title="Video" defaults={{ title: '', url: '', poster: '', type: 'Walkthrough', active: true }} fields={[
    { name: 'title', label: 'Video Title', type: 'text' },
    { name: 'type', label: 'Video Type', type: 'select', options: ['Walkthrough', 'Drone', 'Amenities', 'Other'] },
    { name: 'url', label: 'Video File (MP4) or URL', type: 'file', accept: 'video/mp4' },
    { name: 'poster', label: 'Poster Image', type: 'image' },
    { name: 'active', label: 'Active', type: 'toggle' },
  ]} columns={[
    { key: 'title', label: 'Title', render: (i) => <b>{i.title}</b> },
    { key: 'type', label: 'Type', render: (i) => <span className="badge copper">{i.type}</span> },
  ]} />
);

export const FloorPlansPage = () => (
  <ManagerPage apiPath="floor-plans" title="Floor Plan" defaults={{ title: '', image: '', propertyType: '3 BHK Row House', plotSize: "20' × 40'", description: '', downloadUrl: '', active: true }} fields={[
    { name: 'title', label: 'Plan Title', type: 'text' },
    { name: 'propertyType', label: 'Property Type', type: 'text' },
    { name: 'plotSize', label: 'Plot Size', type: 'text' },
    { name: 'image', label: 'Plan Image', type: 'image' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'downloadUrl', label: 'Downloadable Plan / PDF', type: 'file', accept: 'application/pdf' },
    { name: 'active', label: 'Active', type: 'toggle' },
  ]} columns={[
    { key: 'image', label: 'Plan', render: (i) => <img src={i.image} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8, background: '#fff' }} /> },
    { key: 'title', label: 'Title', render: (i) => <b>{i.title}</b> },
    { key: 'plotSize', label: 'Plot Size' },
  ]} />
);

export const SpecificationsPage = () => (
  <ManagerPage apiPath="specifications" title="Specification" defaults={{ category: 'Structure', title: '', description: '', icon: 'structure', active: true }} fields={[
    { name: 'category', label: 'Category', type: 'select', options: ['Structure', 'Electrification', 'Flooring', 'Doors', 'Windows', 'Wall Finish', 'Toilet and Plumbing', 'Kitchen'] },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'icon', label: 'Icon', type: 'icon' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'active', label: 'Active', type: 'toggle' },
  ]} columns={[
    { key: 'category', label: 'Category', render: (i) => <span className="badge copper">{i.category}</span> },
    { key: 'title', label: 'Title', render: (i) => <b>{i.title}</b> },
  ]} />
);

export const LocationPage = () => (
  <SingletonPage apiPath="location" title="Project Location" fields={[
    { name: 'active', label: 'Section Active', type: 'toggle' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'lat', label: 'Latitude', type: 'number' },
    { name: 'lng', label: 'Longitude', type: 'number' },
    { name: 'mapsLink', label: 'Google Maps Link', type: 'text' },
    { name: 'embedUrl', label: 'Embedded Map URL', type: 'text', help: 'Use a Google Maps “output=embed” URL' },
    { name: 'landmarks', label: 'Nearby Landmarks', type: 'pairs', pairLabels: ['Landmark', 'Distance'] },
  ]} />
);

export const BrochurePage = () => (
  <SingletonPage apiPath="brochure" title="Brochure" fields={[
    { name: 'active', label: 'Brochure Active', type: 'toggle' },
    { name: 'title', label: 'Brochure Title', type: 'text' },
    { name: 'fileUrl', label: 'PDF File', type: 'file', accept: 'application/pdf' },
    { name: 'previewImage', label: 'Preview Image', type: 'image' },
    { name: 'version', label: 'Version', type: 'text' },
  ]} />
);

export const SettingsPage = () => (
  <SingletonPage apiPath="settings" title="Contact & Project Settings" fields={[
    { name: 'projectName', label: 'Project Name', type: 'text' },
    { name: 'tagline', label: 'Tagline', type: 'text' },
    { name: 'phone', label: 'Phone Number', type: 'text' },
    { name: 'whatsapp', label: 'WhatsApp Number', type: 'text', help: 'Digits only with country code, e.g. 919104717214' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'instagram', label: 'Instagram URL', type: 'text' },
    { name: 'facebook', label: 'Facebook URL', type: 'text' },
    { name: 'mapsLink', label: 'Google Maps Link', type: 'text' },
    { name: 'footerText', label: 'Footer Text', type: 'textarea' },
    { name: 'copyright', label: 'Copyright Text', type: 'text' },
  ]} />
);

export const SeoPage = () => (
  <SingletonPage apiPath="seo" title="SEO Management" fields={[
    { name: 'title', label: 'Page Title', type: 'text' },
    { name: 'description', label: 'Meta Description', type: 'textarea' },
    { name: 'keywords', label: 'Keywords', type: 'text' },
    { name: 'canonical', label: 'Canonical URL', type: 'text' },
    { name: 'ogImage', label: 'Open Graph Image', type: 'image' },
    { name: 'index', label: 'Allow Search Indexing', type: 'toggle' },
    { name: 'structuredData', label: 'Structured Data (JSON-LD)', type: 'json' },
  ]} />
);
