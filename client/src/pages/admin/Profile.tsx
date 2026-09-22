import { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/ui';
import { Field } from '../../lib/fields';

export default function Profile() {
  const { admin, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { name, email });
      await refresh();
      toast('Profile updated');
    } catch (err: any) {
      toast(err.response?.data?.message ?? 'Update failed', 'red');
    }
  };

  const savePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast('Passwords do not match', 'amber');
    try {
      await api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Password changed successfully');
    } catch (err: any) {
      toast(err.response?.data?.message ?? 'Password change failed', 'red');
    }
  };

  return (
    <div className="duo">
      <div className="panel">
        <div className="panel-head"><h3>Admin Profile</h3></div>
        <div className="panel-body">
          <form onSubmit={saveProfile} style={{ display: 'grid', gap: 16 }}>
            <Field label="Full Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Role"><input className="input" value={admin?.role ?? ''} disabled /></Field>
            <button className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }}>Save Profile</button>
          </form>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h3>Change Password</h3></div>
        <div className="panel-body">
          <form onSubmit={savePw} style={{ display: 'grid', gap: 16 }}>
            <Field label="Current Password"><input className="input" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
            <Field label="New Password (min 8 chars)"><input className="input" type="password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
            <Field label="Confirm New Password"><input className="input" type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <button className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
