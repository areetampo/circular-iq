export default function Toast({ id, message, type, onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">{message}</div>
      <button className="toast-close" onClick={() => onClose(id)} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}
