import { useEffect, useRef } from "react";

export default function Modal({ open, onClose, title = "Dialog", children }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    // focus the close button when opened
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={onClose} // click backdrop closes
    >
      {/* Backdrop at 90% opacity */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal panel */}
      <div
        className="relative z-10 w-[min(720px,92vw)] max-h-[85vh] overflow-auto
                   bg-[var(--color-background)] text-[var(--color-text)]
                   rounded-xl border p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="btn-theme"
            aria-label="Close dialog"
            title="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
