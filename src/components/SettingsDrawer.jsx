import { useEffect, useRef, useState } from "react";

const THEME_KEY = "theme";
const FOUR_COLOR_KEY = "four-color";

function readHtmlClass(name) {
  return document.documentElement.classList.contains(name);
}

function useHtmlClassSetting(className, storageKey, toStored) {
  const [enabled, setEnabled] = useState(() => readHtmlClass(className));

  const toggle = () => {
    const next = !enabled;
    document.documentElement.classList.toggle(className, next);
    localStorage.setItem(storageKey, toStored(next));
    setEnabled(next);
  };

  return [enabled, toggle];
}

function Switch({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)] py-3.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px] text-[var(--color-text)]">{label}</span>
        {description && (
          <span className="block text-xs text-[var(--color-text-muted)]">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
          checked
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "border-[var(--color-border)] bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      className="mt-5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {children}
    </div>
  );
}

export default function SettingsDrawer({ open, onClose, accountLabel, accountDetail, onOpenAccount }) {
  const [isDark, toggleDark] = useHtmlClassSetting("dark", THEME_KEY, (on) => (on ? "dark" : "light"));
  const [fourColor, toggleFourColor] = useHtmlClassSetting("four-color", FOUR_COLOR_KEY, (on) => (on ? "on" : "off"));
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleOpenAccount = () => {
    onClose();
    onOpenAccount();
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        inert={open ? undefined : ""}
        className={`absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3.5">
          <h2
            className="text-sm uppercase tracking-widest text-[var(--color-text-muted)]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Settings
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="btn-theme h-7 w-7 p-0 text-xs"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="px-4">
          <SectionLabel>Account</SectionLabel>
          <button
            type="button"
            onClick={handleOpenAccount}
            className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)] py-3.5 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[15px] text-[var(--color-text)]">{accountLabel}</span>
              <span className="block truncate text-xs text-[var(--color-text-muted)]">{accountDetail}</span>
            </span>
            <span aria-hidden="true" className="text-xl text-[var(--color-text-muted)]">›</span>
          </button>

          <SectionLabel>Display</SectionLabel>
          <Switch label="Dark mode" checked={isDark} onChange={toggleDark} />
          <Switch
            label="Four-color deck"
            description="Clubs green, diamonds blue"
            checked={fourColor}
            onChange={toggleFourColor}
          />

          <SectionLabel>About</SectionLabel>
          <a
            href="/privacy.html"
            className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)] py-3.5 text-[15px] text-[var(--color-text)]"
          >
            Privacy policy
            <span aria-hidden="true" className="text-xl text-[var(--color-text-muted)]">›</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
