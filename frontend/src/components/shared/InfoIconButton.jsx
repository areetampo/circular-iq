export default function InfoIconButton({ onClick, title, size = 20 }) {
  return (
    <button
      className="bg-none border-none cursor-pointer p-1 flex items-center justify-center transition-transform hover:scale-110"
      onClick={onClick}
      title={title}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#34a83a" strokeWidth="2" />
        <path d="M12 16v-4M12 8h.01" stroke="#34a83a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
