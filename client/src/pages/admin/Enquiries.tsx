import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Empty, Modal, Pager, Skeleton, useConfirm, useToast, fmtDate, fmtDateTime } from '../../lib/ui';
import { Icon } from '../../lib/icons';
import { Field } from '../../lib/fields';
import type { Enquiry } from '../../lib/types';
import VisitModal from './VisitModal';

const STATUSES = ['New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Follow-up', 'Converted', 'Closed'];
const TYPES = ['3 BHK Residence', 'Open Plot', 'General'];

export default function Enquiries() {
  const [params] = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<Enquiry[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState({ search: '', status: params.get('status') ?? '', type: '', from: '', to: '', sort: 'newest' });
  const [sel, setSel] = useState<Enquiry | null>(null);
  const [note, setNote] = useState('');
  const [visitFor, setVisitFor] = useState<string | null>(null);

  const load = useCallback(() => {
    setItems(null);
    api.get('/enquiries', { params: { page, limit: 10, ...Object.fromEntries(Object.entries(q).filter(([, v]) => v)) } })
      .then(({ data }) => { setItems(data.items); setTotalPages(data.pagination.totalPages); setTotal(data.pagination.total); })
      .catch(() => { setItems([]); toast('Failed to load enquiries', 'red'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, body: Record<string, unknown>, msg?: string) => {
    const { data } = await api.patch(`/enquiries/${id}`, body);
    setItems((xs) => xs?.map((x) => (x._id === id ? data.item : x)) ?? null);
    setSel((s) => (s && s._id === id ? data.item : s));
    if (msg) toast(msg);
  };

  const del = async (e: Enquiry) => {
    const ok = await confirm({ title: 'Delete enquiry', message: `Delete the enquiry from ${e.fullName}? This cannot be undone.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    await api.delete(`/enquiries/${e._id}`);
    toast('Enquiry deleted');
    setSel(null);
    load();
  };

  const addNote = async () => {
    if (!sel || !note.trim()) return;
    const { data } = await api.post(`/enquiries/${sel._id}/notes`, { text: note });
    setSel(data.item);
    setItems((xs) => xs?.map((x) => (x._id === sel._id ? data.item : x)) ?? null);
    setNote('');
    toast('Note added');
  };

  const exportCsv = async () => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([, v]) => v)) as Record<string, string>);
    try {
      // Download through the authenticated API client (token header), not a bare window.open.
      const { data } = await api.get(`/enquiries/export?${qs}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shivanta-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast('Could not export CSV');
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="input grow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="search" size={15} style={{ color: 'var(--muted)' }} />
          <input style={{ border: 0, outline: 0, flex: 1, font: 'inherit', background: 'transparent' }} placeholder="Search name, mobile, email…" value={q.search} onChange={(e) => { setQ({ ...q, search: e.target.value }); setPage(1); }} />
        </div>
        <select className="select" value={q.status} onChange={(e) => { setQ({ ...q, status: e.target.value }); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={q.type} onChange={(e) => { setQ({ ...q, type: e.target.value }); setPage(1); }}>
          <option value="">All types</option>
          {TYPES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="input" type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} title="From date" />
        <input className="input" type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} title="To date" />
        <select className="select" value={q.sort} onChange={(e) => setQ({ ...q, sort: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Icon name="download" size={14} /> CSV</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Contact</th><th>Type</th><th>Status</th><th>Source</th><th>Created</th><th style={{ width: 90 }}>Actions</th></tr>
            </thead>
            <tbody>
              {items?.map((e) => (
                <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => setSel(e)}>
                  <td><b>{e.fullName}</b></td>
                  <td>{e.mobile}<br /><small style={{ color: 'var(--muted)' }}>{e.email || '—'}</small></td>
                  <td><span className="badge copper">{e.enquiryType}</span></td>
                  <td><Badge status={e.status} /></td>
                  <td style={{ color: 'var(--muted)' }}>{e.source}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</td>
                  <td>
                    <div className="row-actions" onClick={(ev) => ev.stopPropagation()}>
                      <a className="mini-btn" title="Call" href={`tel:+91${e.mobile}`}><Icon name="phone" size={14} /></a>
                      <a className="mini-btn" title="WhatsApp" target="_blank" rel="noreferrer" href={`https://wa.me/91${e.mobile}`}><Icon name="whatsapp" size={14} /></a>
                      <button className="mini-btn" title="Open" onClick={() => setSel(e)}><Icon name="eye" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items === null && <div style={{ padding: 18, display: 'grid', gap: 10 }}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={44} />)}</div>}
          {items?.length === 0 && <Empty icon="users" title="No enquiries match" message="Adjust filters or wait for new website enquiries." />}
        </div>
        <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
      </div>

      {sel && (
        <Modal title={sel.fullName} onClose={() => setSel(null)} wide footer={
          <>
            <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff', marginRight: 'auto' }} onClick={() => del(sel)}>
              <Icon name="trash" size={14} /> Delete
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setVisitFor(sel._id)}><Icon name="calendar" size={14} /> Schedule Visit</button>
            <button className="btn btn-primary btn-sm" onClick={() => { patch(sel._id, { status: 'Converted' }, 'Marked as converted 🎉'); }}>Mark Converted</button>
          </>
        }>
          <div className="form-grid">
            <div className="field"><label>Mobile</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>{sel.mobile}</span>
                <a className="mini-btn" title="Call" href={`tel:+91${sel.mobile}`}><Icon name="phone" size={14} /></a>
                <a className="mini-btn" title="WhatsApp" target="_blank" rel="noreferrer" href={`https://wa.me/91${sel.mobile}?text=${encodeURIComponent(`Hello ${sel.fullName}, thank you for your interest in Shivanta Homes.`)}`}><Icon name="whatsapp" size={14} /></a>
              </div>
            </div>
            <div className="field"><label>Email</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{sel.email || '—'}</span>
                {sel.email && <a className="mini-btn" title="Email" href={`mailto:${sel.email}?subject=${encodeURIComponent('Shivanta Homes — your enquiry')} `}><Icon name="mail" size={14} /></a>}
              </div>
            </div>
            <Field label="Enquiry Type">
              <select className="select" value={sel.enquiryType} onChange={(e) => patch(sel._id, { enquiryType: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="select" value={sel.status} onChange={(e) => patch(sel._id, { status: e.target.value }, `Status → ${e.target.value}`)}>
                {STATUSES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div className="field"><label>Preferred Visit</label><span>{sel.preferredVisitDate ? fmtDate(sel.preferredVisitDate) : '—'}</span></div>
            <div className="field"><label>Source / Received</label><span>{sel.source} • {fmtDateTime(sel.createdAt)}</span></div>
            {sel.message && <div className="field full"><label>Message</label><p style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', fontSize: 14, lineHeight: 1.7 }}>{sel.message}</p></div>}
          </div>

          <div>
            <label style={{ fontSize: 11.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--muted)' }}>Internal Notes</label>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {sel.notes.map((n, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
                  {n.text}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{n.createdBy} • {fmtDateTime(n.createdAt)}</div>
                </div>
              ))}
              {sel.notes.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>No notes yet.</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input className="input" placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <button className="btn btn-ghost btn-sm" onClick={addNote}><Icon name="plus" size={14} /> Add</button>
            </div>
          </div>
        </Modal>
      )}

      {visitFor && <VisitModal enquiryId={visitFor} onClose={() => setVisitFor(null)} onSaved={load} />}
    </>
  );
}
