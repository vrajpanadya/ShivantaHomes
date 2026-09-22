import React, { createContext, useCallback, useContext, useState } from 'react';
import { Icon } from './icons';

/* ------------------------------- Toasts ------------------------------- */
interface Toast { id: number; msg: string; type: 'green' | 'red' | 'amber' }
const ToastCtx = createContext<(msg: string, type?: Toast['type']) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, type: Toast['type'] = 'green') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === 'green' ? 'check' : t.type === 'red' ? 'warning' : 'info'} size={17} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------- Confirm ------------------------------ */
interface ConfirmOpts { title: string; message: string; confirmText?: string; danger?: boolean }
const ConfirmCtx = createContext<(opts: ConfirmOpts) => Promise<boolean>>(() => Promise.resolve(false));
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { open: boolean }) | null>(null);
  const resolveRef = React.useRef<(v: boolean) => void>(() => undefined);
  const ask = useCallback((opts: ConfirmOpts) => {
    setState({ ...opts, open: true });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);
  const close = (v: boolean) => {
    resolveRef.current(v);
    setState(null);
  };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {state?.open && (
        <div className="modal-backdrop" onClick={() => close(false)}>
          <div className="modal" style={{ width: 'min(440px, 94vw)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{state.title}</h3>
              <button className="icon-btn" onClick={() => close(false)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body"><p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.7 }}>{state.message}</p></div>
            <div className="modal-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => close(false)}>Cancel</button>
              <button className="btn btn-sm" style={state.danger ? { background: 'var(--red)', color: '#fff' } : { background: 'var(--copper)', color: '#fff' }} onClick={() => close(true)}>
                {state.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

/* ------------------------------- Modal -------------------------------- */
export function Modal({ title, onClose, children, wide, footer }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* --------------------------- Small components -------------------------- */
export function Badge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    ['converted', 'completed', 'active', 'confirmed'].some((k) => s.includes(k)) ? 'green'
    : ['new', 'requested'].some((k) => s.includes(k)) ? 'copper'
    : ['contacted', 'interested', 'scheduled', 'follow', 'rescheduled'].some((k) => s.includes(k)) ? 'amber'
    : ['closed', 'cancelled', 'no show'].some((k) => s.includes(k)) ? 'red'
    : 'gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function Skeleton({ h = 16, w = '100%', style }: { h?: number; w?: number | string; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} />;
}

export function Empty({ icon = 'info', title, message }: { icon?: string; title: string; message?: string }) {
  return (
    <div className="empty">
      <Icon name={icon} size={44} strokeWidth={1.2} />
      <h4>{title}</h4>
      {message && <p>{message}</p>}
    </div>
  );
}

export function Pager({ page, totalPages, onPage, total }: { page: number; totalPages: number; onPage: (p: number) => void; total?: number }) {
  if (totalPages <= 1 && !total) return null;
  return (
    <div className="pager">
      {total !== undefined && <span style={{ marginRight: 'auto' }}>{total} record{total === 1 ? '' : 's'}</span>}
      <button className="mini-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon name="chevL" size={15} /></button>
      <span>{page} / {totalPages}</span>
      <button className="mini-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}><Icon name="chevR" size={15} /></button>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ width: 34, height: 34, border: '3px solid var(--line)', borderTopColor: 'var(--copper)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" className={`switch ${on ? 'on' : ''}`} aria-label={label ?? 'toggle'} onClick={() => onChange(!on)} />
  );
}

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
