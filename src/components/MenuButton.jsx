export default function MenuButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-theme"
    >
      {children}
    </button>
  );
}