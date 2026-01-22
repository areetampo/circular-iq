export default function InfoIconButton({ onClick, title, size = 20 }) {
  return (
    <>
      <button className="info-icon-btn" onClick={onClick} title={title}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#34a83a" strokeWidth="2" />
          <path d="M12 16v-4M12 8h.01" stroke="#34a83a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <style jsx>{`
        .info-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .info-icon-btn:hover {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}
