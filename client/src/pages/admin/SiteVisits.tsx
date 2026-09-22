import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { Badge, Empty, Pager, Skeleton, useConfirm, useToast, fmtDate } from '../../lib/ui';
import { Icon } from '../../lib/icons';
import type { SiteVisit } from '../../lib/types';
import VisitModal, { VISIT_STATUSES } from './VisitModal';

export default function SiteVisits() {
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [items, setItems] = useState<SiteVisit[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState({ search: '', status: '', date: '' });
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [editing, setEditing] = useState<SiteVisit | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setItems(null);
    api.get('/site-visits', { params: { page, limit: view === 'calendar' ? 100 : 10, ...Object.fromEntries(Object.entries(q).filter(([, v]) => v)) } })
      .then(({ data }) => { setItems(data.items); setTotalPages(data.pagination.totalPages); setTotal(data.pagination.total); })
      .catch(() => setItems([]));
  }, [page, q, view]);

  useEffect(() => { load(); }, [load]);

  const quickStatus = async (v: SiteVisit, status: string) => {
    await api.patch(`/site-visits/${v._id}`, { status });
    toast(`Visit ${status.toLowerCase()}`);
    load();
  };

  const del = async (v: SiteVisit) => {
    const ok = await confirm({ title: 'Delete site visit', message: `Delete the visit for ${v.customerName}?`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    await api.delete(`/site-visits/${v._id}`);
    toast('Visit deleted');
    load();
  };

  /* Calendar computation */
  const calCells = useMemo(() => {
    const first = new Date(Date.UTC(month.y, month.m, 1));
    const startDay = first.getUTCDay();
    const cells: { date: string; day: number; other: boolean }[] = [];
    const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    const prevDays = new Date(Date.UTC(month.y, month.m, 0)).getUTCDate();
    for (let i = startDay - 1; i >= 0; i--) cells.push({ date: iso(month.y, month.m - 1, prevDays - i), day: prevDays - i, other: true });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: iso(month.y, month.m, d), day: d, other: false });
    while (cells.length % 7 !== 0) { const last = cells.length - startDay - daysInMonth + 1; cells.push({ date: iso(month.y, month.m + 1, last), day: last, other: true }); }
    return cells;
  }, [month]);

  const byDate = useMemo(() => {
    const map: Record<string, SiteVisit[]> = {};
    (items ?? []).forEach((v) => { const k = v.visitDate.slice(0, 10); (map[k] ??= []).push(v); });
    return map;
  }, [items]);

  const today = new Date().toISOString().slice(0, 10);
  const monthLabel = new Date(Date.UTC(month.y, month.m, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="toolbar">
        <div className="input grow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="search" size={15} style={{ color: 'var(--muted)' }} />
          <input style={{ border: 0, outline: 0, flex: 1, font: 'inherit', background: 'transparent' }} placeholder="Search customer, phone…" value={q.search} onChange={(e) => { setQ({ ...q, search: e.target.value }); setPage(1); }} />
        </div>
        <select className="select" value={q.status} onChange={(e) => { setQ({ ...q, status: e.target.value }); setPage(1); }}>
          <option value="">All statuses</option>
          {VISIT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="input" type="date" value={q.date} onChange={(e) => setQ({ ...q, date: e.target.value })} />
        <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
          {(['list', 'calendar'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '9px 14px', border: 0, background: view === v ? 'var(--ink)' : '#fff', color: view === v ? '#fff' : 'var(--muted)', fontWeight: 700, fontSize: 12.5, textTransform: 'capitalize' }}>
              <Icon name={v === 'list' ? 'list' : 'grid'} size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />{v}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Icon name="plus" size={14} /> Add Visit</button>
      </div>

      {view === 'list' ? (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Customer</th><th>Visit</th><th>Visitors</th><th>Interest</th><th>Status</th><th>Enquiry</th><th style={{ width: 150 }}>Actions</th></tr></thead>
              <tbody>
                {items?.map((v) => (
                  <tr key={v._id}>
                    <td><b>{v.customerName}</b><br /><small style={{ color: 'var(--muted)' }}>{v.phone}</small></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(v.visitDate)}<br /><small style={{ color: 'var(--muted)' }}>{v.visitTime}</small></td>
                    <td>{v.visitors}</td>
                    <td>{v.interest}</td>
                    <td><Badge status={v.status} /></td>
                    <td>{v.enquiry ? <span className="badge copper">{(v.enquiry as any).fullName}</span> : '—'}</td>
                    <td>
                      <div className="row-actions">
                        {v.status === 'Requested' && <button className="mini-btn" title="Confirm" onClick={() => quickStatus(v, 'Confirmed')}><Icon name="check" size={14} /></button>}
                        {['Requested', 'Confirmed', 'Rescheduled'].includes(v.status) && (
                          <button className="mini-btn" title="Reschedule" onClick={() => setEditing(v)}><Icon name="calendar" size={14} /></button>
                        )}
                        {['Confirmed', 'Rescheduled'].includes(v.status) && (
                          <button className="mini-btn" title="Mark completed" onClick={() => quickStatus(v, 'Completed')}><Icon name="activity" size={14} /></button>
                        )}
                        <button className="mini-btn" title="Edit" onClick={() => setEditing(v)}><Icon name="edit" size={14} /></button>
                        <button className="mini-btn danger" title="Delete" onClick={() => del(v)}><Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items === null && <div style={{ padding: 18, display: 'grid', gap: 10 }}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={44} />)}</div>}
            {items?.length === 0 && <Empty icon="calendar" title="No site visits" message="Schedule visits from enquiries or add one manually." />}
          </div>
          <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <h3>{monthLabel}</h3>
            <button className="mini-btn" onClick={() => setMonth((m) => ({ y: m.m === 0 ? m.y - 1 : m.y, m: m.m === 0 ? 11 : m.m - 1 }))}><Icon name="chevL" size={15} /></button>
            <button className="mini-btn" onClick={() => setMonth((m) => ({ y: m.m === 11 ? m.y + 1 : m.y, m: m.m === 11 ? 0 : m.m + 1 }))}><Icon name="chevR" size={15} /></button>
          </div>
          <div className="panel-body">
            <div className="cal-head">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>
            <div className="cal-grid">
              {calCells.map((c, i) => (
                <div key={i} className={`cal-day ${c.other ? 'other' : ''} ${c.date === today ? 'today' : ''}`}>
                  <div className="d">{c.day}</div>
                  {(byDate[c.date] ?? []).map((v) => (
                    <div key={v._id} className="cal-visit" title={`${v.customerName} ${v.visitTime}`} onClick={() => setEditing(v)}>
                      {v.visitTime} {v.customerName.split(' ')[0]}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <VisitModal visit={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={load} />
      )}
    </>
  );
}

function iso(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}
