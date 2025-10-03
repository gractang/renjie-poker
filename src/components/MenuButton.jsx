export default function MenuButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-theme ${className}`}
    >
      {children}
    </button>
  );
}