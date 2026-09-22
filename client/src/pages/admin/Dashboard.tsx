import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import api from '../../lib/api';
import { Badge, Empty, Skeleton, fmtDate } from '../../lib/ui';
import { Icon } from '../../lib/icons';

const COLORS = ['#9c7060', '#c89242', '#2f7d4f', '#b3402f', '#71655c'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setD(r.data)).catch(() => setD({ error: true }));
  }, []);

  if (!d) {
    return (
      <>
        <div className="cards-grid">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={96} />)}</div>
        <div className="chart-row"><Skeleton h={280} /><Skeleton h={280} /></div>
      </>
    );
  }
  if (d.error) return <Empty icon="warning" title="Could not load dashboard" message="Check the API connection and refresh." />;

  const monthly = (d.monthly ?? []).map((m: any) => ({ name: `${MONTHS[m._id.m - 1]} ${String(m._id.y).slice(2)}`, enquiries: m.count }));
  const byType = (d.byType ?? []).map((t: any) => ({ name: t._id, value: t.count }));
  const s = d.stats;

  const cards = [
    { lbl: 'Total Enquiries', val: s.totalEnquiries, sub: `${s.newThisWeek} this week` },
    { lbl: 'New Enquiries', val: s.newEnquiries },
    { lbl: 'Contacted Leads', val: s.contacted },
    { lbl: 'Scheduled Visits', val: s.scheduledVisits },
    { lbl: 'Completed Visits', val: s.completedVisits },
    { lbl: '3 BHK Enquiries', val: s.threeBhkEnquiries },
    { lbl: 'Open-Plot Enquiries', val: s.openPlotEnquiries },
    { lbl: 'Gallery Images', val: s.galleryImages },
  ];

  return (
    <>
      <div className="cards-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.lbl}>
            <div className="lbl">{c.lbl}</div>
            <div className="val">{c.val}</div>
            {c.sub && <div className="sub">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="chart-row">
        <div className="panel">
          <div className="panel-head"><h3>Monthly Enquiries</h3></div>
          <div className="panel-body" style={{ height: 280 }}>
            {monthly.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9c7060" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#9c7060" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip />
                  <Area type="monotone" dataKey="enquiries" stroke="#9c7060" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty icon="activity" title="No enquiry data yet" message="Enquiries will chart here as they arrive." />
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>Enquiry Types</h3></div>
          <div className="panel-body" style={{ height: 280 }}>
            {byType.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                    {byType.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty icon="users" title="No data yet" />
            )}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              {byType.map((t: any, i: number) => (
                <span key={t.name} style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], display: 'inline-block' }} /> {t.name} ({t.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="duo">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Enquiries</h3>
            <Link to="/admin/enquiries" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {(d.recentEnquiries ?? []).map((e: any) => (
                  <tr key={e._id}>
                    <td><b>{e.fullName}</b><br /><small style={{ color: 'var(--muted)' }}>{e.mobile}</small></td>
                    <td>{e.enquiryType}</td>
                    <td><Badge status={e.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(d.recentEnquiries ?? []).length === 0 && <Empty icon="users" title="No enquiries yet" message="New website enquiries appear here instantly." />}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Upcoming Site Visits</h3>
            <Link to="/admin/site-visits" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 10 }}>
            {(d.upcomingVisits ?? []).map((v: any) => (
              <div key={v._id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--line)' }}>
                <Icon name="calendar" size={18} style={{ color: 'var(--copper)' }} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>{v.customerName}</b>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(v.visitDate)} at {v.visitTime} • {v.visitors} visitor(s)</div>
                </div>
                <Badge status={v.status} />
              </div>
            ))}
            {(d.upcomingVisits ?? []).length === 0 && <Empty icon="calendar" title="No upcoming visits" message="Schedule site visits from an enquiry or the Site Visits page." />}
          </div>
          <div className="panel-head" style={{ borderTop: '1px solid var(--line)' }}>
            <h3>Quick Actions</h3>
          </div>
          <div className="panel-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-ghost btn-sm" to="/admin/site-visits"><Icon name="plus" size={14} /> Schedule Visit</Link>
            <Link className="btn btn-ghost btn-sm" to="/admin/media"><Icon name="upload" size={14} /> Upload Media</Link>
            <Link className="btn btn-ghost btn-sm" to="/admin/hero"><Icon name="edit" size={14} /> Edit Hero</Link>
            <Link className="btn btn-ghost btn-sm" to="/admin/enquiries?status=New"><Icon name="users" size={14} /> New Leads</Link>
          </div>
        </div>
      </div>
    </>
  );
}
