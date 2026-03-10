import { useEffect, useRef } from "react";

export default function Modal({ open, onClose, title = "Dialog", children }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
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
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative z-10 w-[min(720px,92vw)] max-h-[85vh] overflow-auto
                   bg-[var(--color-surface)] text-[var(--color-text)]
                   border border-[var(--color-border)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-sm uppercase tracking-widest text-[var(--color-text-muted)]" style={{ fontFamily: "'DM Mono', monospace" }}>
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="btn-theme w-7 h-7 p-0 text-xs"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
