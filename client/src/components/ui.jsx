import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { scoreTone } from '../utils/format';

export const Spinner = ({ size = 'md' }) => <span className={`spinner spinner-${size}`} aria-hidden="true" />;

export const LoadingScreen = ({ message = 'Loading…' }) => (
  <div className="loading-screen" role="status">
    <Spinner size="lg" />
    <p>{message}</p>
  </div>
);

export const LoadingBlock = ({ message = 'Loading…' }) => (
  <div className="loading-block" role="status">
    <Spinner />
    <p>{message}</p>
  </div>
);

const ALERT_ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

export const Alert = ({ tone = 'info', children, action }) => {
  const Icon = ALERT_ICONS[tone];
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div className="alert-body">{children}</div>
      {action}
    </div>
  );
};

export const ErrorState = ({ message, onRetry }) => (
  <div className="empty-state">
    <div className="empty-icon empty-icon-danger">
      <AlertCircle size={28} />
    </div>
    <h3>We couldn't load this page</h3>
    <p>{message}</p>
    {onRetry && (
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon, title, children, action }) => (
  <div className="empty-state">
    {Icon && (
      <div className="empty-icon">
        <Icon size={28} />
      </div>
    )}
    <h3>{title}</h3>
    {children && <p>{children}</p>}
    {action}
  </div>
);

export const ProgressBar = ({ value, tone = 'brand', label }) => (
  <div
    className={`progress progress-${tone}`}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value)}
    aria-label={label}
  >
    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

// Circular score indicator
export const ScoreRing = ({ score, size = 132 }) => {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`score-ring tone-${scoreTone(score)}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="score-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <div className="score-ring-label">
        <strong>{score}%</strong>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Language code tile (flag emoji don't render on Windows)
export const LanguageBadge = ({ code, size = 'md' }) => (
  <span className={`language-badge language-badge-${size}`} data-lang={code} aria-hidden="true">
    {code?.toUpperCase()}
  </span>
);
