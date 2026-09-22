import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Modal, useToast } from '../../lib/ui';
import { Field } from '../../lib/fields';
import type { SiteVisit } from '../../lib/types';

export const VISIT_STATUSES = ['Requested', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'];

const blank = { customerName: '', phone: '', email: '', visitDate: '', visitTime: '10:00', visitors: 2, interest: '3 BHK Residence', notes: '', status: 'Requested' };

export default function VisitModal({ visit, enquiryId, onClose, onSaved }: { visit?: SiteVisit | null; enquiryId?: string; onClose: () => void; onSaved?: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<any>(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visit) {
      setForm({
        customerName: visit.customerName, phone: visit.phone, email: visit.email,
        visitDate: visit.visitDate?.slice(0, 10), visitTime: visit.visitTime, visitors: visit.visitors,
        interest: visit.interest, notes: visit.notes, status: visit.status,
      });
    } else {
      setForm({ ...blank, enquiryId });
    }
  }, [visit, enquiryId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [k]: k === 'visitors' ? Number(e.target.value) || 1 : e.target.value }));

  const save = async () => {
    if (!form.customerName || !form.phone || !form.visitDate) {
      toast('Name, phone and visit date are required', 'amber');
      return;
    }
    setBusy(true);
    try {
      if (visit?._id) await api.patch(`/site-visits/${visit._id}`, form);
      else await api.post('/site-visits', { ...form, enquiryId });
      toast(visit ? 'Site visit updated' : 'Site visit scheduled');
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast(e.response?.data?.message ?? 'Save failed', 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={visit ? 'Edit Site Visit' : 'Schedule Site Visit'} onClose={onClose} wide footer={
      <>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Visit'}</button>
      </>
    }>
      <div className="form-grid">
        <Field label="Customer Name *"><input className="input" value={form.customerName} onChange={set('customerName')} /></Field>
        <Field label="Phone *"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Email"><input className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Interest">
          <select className="select" value={form.interest} onChange={set('interest')}>
            <option>3 BHK Residence</option><option>Open Plot</option><option>General</option>
          </select>
        </Field>
        <Field label="Visit Date *"><input className="input" type="date" value={form.visitDate} onChange={set('visitDate')} /></Field>
        <Field label="Visit Time"><input className="input" type="time" value={form.visitTime} onChange={set('visitTime')} /></Field>
        <Field label="Number of Visitors"><input className="input" type="number" min={1} max={20} value={form.visitors} onChange={set('visitors')} /></Field>
        <Field label="Status">
          <select className="select" value={form.status} onChange={set('status')}>
            {VISIT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Notes" full><textarea className="textarea" value={form.notes} onChange={set('notes')} /></Field>
      </div>
    </Modal>
  );
}
