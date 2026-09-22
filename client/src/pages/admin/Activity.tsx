import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Empty, Pager, Skeleton, fmtDateTime } from '../../lib/ui';
import { Icon } from '../../lib/icons';

const MODULES = ['auth', 'enquiries', 'site-visits', 'media', 'hero', 'project-overview', 'residences', 'amenities', 'gallery', 'videos', 'floor-plans', 'specifications', 'location', 'brochure', 'settings', 'seo'];

export default function Activity() {
  const [items, setItems] = useState<any[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [module, setModule] = useState('');

  useEffect(() => {
    setItems(null);
    api.get('/activity-logs', { params: { page, limit: 15, module } })
      .then(({ data }) => { setItems(data.items); setTotalPages(data.pagination.totalPages); setTotal(data.pagination.total); })
      .catch(() => setItems([]));
  }, [page, module]);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Admin Activity Log</h3>
        <select className="select" value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}>
          <option value="">All modules</option>
          {MODULES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>When</th><th>Admin</th><th>Module</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {items?.map((l) => (
              <tr key={l._id}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(l.createdAt)}</td>
                <td><b>{l.adminName}</b><br /><small style={{ color: 'var(--muted)' }}>{l.adminEmail}</small></td>
                <td><span className="badge copper">{l.module}</span></td>
                <td><Icon name="activity" size={13} style={{ display: 'inline', marginRight: 6, color: 'var(--copper)' }} />{l.action}</td>
                <td style={{ color: 'var(--muted)', fontSize: 11.5 }}>{l.targetId ? `${l.targetId.slice(0, 8)}…` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items === null && <div style={{ padding: 18, display: 'grid', gap: 10 }}>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={40} />)}</div>}
        {items?.length === 0 && <Empty icon="activity" title="No activity yet" message="Admin actions are tracked here automatically." />}
      </div>
      <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
    </div>
  );
}
