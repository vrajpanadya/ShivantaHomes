import { useState } from 'react';
import api from '../lib/api';
import { Icon } from '../lib/icons';

const TYPES = ['3 BHK Residence', 'Open Plot', 'General'];

export default function EnquiryForm() {
  const [form, setForm] = useState({ fullName: '', mobile: '', email: '', enquiryType: TYPES[0], preferredVisitDate: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Please enter your full name';
    if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      await api.post('/enquiries', form);
      setDone(true);
    } catch (err: any) {
      setErrors({ form: err.response?.data?.message ?? 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="form-card form-success">
        <Icon name="check" size={52} strokeWidth={1.4} />
        <h3>Enquiry Received!</h3>
        <p>Thank you, {form.fullName.split(' ')[0]}. Our team will call you on {form.mobile} shortly to schedule your visit.</p>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} onClick={() => { setDone(false); setForm({ fullName: '', mobile: '', email: '', enquiryType: TYPES[0], preferredVisitDate: '', message: '' }); }}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label>Full Name *</label>
          <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="Your name" />
          {errors.fullName && <span className="err">{errors.fullName}</span>}
        </div>
        <div className="field">
          <label>Mobile Number *</label>
          <input className="input" value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile" inputMode="numeric" />
          {errors.mobile && <span className="err">{errors.mobile}</span>}
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          {errors.email && <span className="err">{errors.email}</span>}
        </div>
        <div className="field">
          <label>I am interested in</label>
          <select className="select" value={form.enquiryType} onChange={set('enquiryType')}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Preferred Visit Date</label>
          <input className="input" type="date" value={form.preferredVisitDate} onChange={set('preferredVisitDate')} />
        </div>
        <div className="field full">
          <label>Message</label>
          <textarea className="textarea" value={form.message} onChange={set('message')} placeholder="Tell us what you are looking for…" />
        </div>
      </div>
      {errors.form && <div className="login-err" style={{ marginTop: 14 }}>{errors.form}</div>}
      <button className="btn btn-primary" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} disabled={busy}>
        {busy ? 'Submitting…' : 'Submit Enquiry'} <Icon name="arrow" size={16} />
      </button>
    </form>
  );
}
