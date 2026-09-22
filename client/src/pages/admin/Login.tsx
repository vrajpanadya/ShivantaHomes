import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Icon } from '../../lib/icons';
import { Modal, useToast } from '../../lib/ui';

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(email, password);
      toast('Welcome back!');
      nav('/admin/dashboard');
    } catch (error: any) {
      setErr(error.response?.data?.message ?? 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(data.message);
    } catch {
      setForgotMsg('Could not send reset link.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <img src="/media/mark.jpg" alt="Shivanta Homes" style={{ borderRadius: 10 }} />
        </div>
        <h1>Admin Console</h1>
        <p className="sub">SHIVANTA HOMES — sign in to manage your website</p>
        {err && <div className="login-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@…" autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" className="mini-btn" style={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setShow(!show)} aria-label="Toggle password">
                <Icon name="eye" size={15} />
              </button>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="login-links">
          <button onClick={() => { setForgot(true); setForgotMsg(''); }}>Forgot password?</button>
          <a href="/">← Back to website</a>
        </div>
      </div>
      {forgot && (
        <Modal title="Reset password" onClose={() => setForgot(false)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setForgot(false)}>Close</button>
            <button className="btn btn-primary btn-sm" onClick={sendReset}>Send reset link</button>
          </>
        }>
          <div className="field">
            <label>Admin email</label>
            <input className="input" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="admin@…" />
          </div>
          {forgotMsg && <p style={{ fontSize: 13.5, color: 'var(--green)', fontWeight: 700 }}>{forgotMsg}</p>}
          <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>If email delivery is configured, a secure reset link will be emailed to you.</p>
        </Modal>
      )}
    </div>
  );
}

export function ResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword: pw });
      setMsg({ ok: true, text: data.message });
      setTimeout(() => nav('/admin/login'), 1500);
    } catch (error: any) {
      setMsg({ ok: false, text: error.response?.data?.message ?? 'Reset failed' });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Choose a new password</h1>
        <p className="sub">Enter your new password below.</p>
        {msg && <div className="login-err" style={msg.ok ? { background: 'rgba(47,125,79,.1)', color: 'var(--green)', borderColor: 'rgba(47,125,79,.3)' } : undefined}>{msg.text}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>New password (min 8 characters)</label>
            <input className="input" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!token}>Reset Password</button>
        </form>
      </div>
    </div>
  );
}
