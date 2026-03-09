import { formatCard } from "../lib/deck";

export default function CardButton({ card, disabled = false, selected = false, onToggle }) {
  const isRed = card.suitKey === "H" || card.suitKey === "D";
  return (
    <button
      onClick={() => !disabled && onToggle?.(card)}
      className={[
        "relative w-16 h-24 sm:w-16 sm:h-24 lg:w-20 lg:h-28",
        "rounded border flex items-center justify-center m-0.5 cursor-pointer touch-manipulation select-none",
        "transition-all duration-150 active:scale-[0.98]",
        disabled
          ? "bg-[var(--color-background)] text-[var(--color-border)] cursor-not-allowed opacity-40"
          : selected
            ? "bg-emerald-50 dark:bg-emerald-950 border-[var(--color-selected)] ring-2 ring-[var(--color-selected)] shadow-sm"
            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] active:border-[var(--color-accent)] active:bg-emerald-50/70 dark:active:bg-emerald-950/70",
      ].join(" ")}
      title={formatCard(card)}
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <span className={
        selected && !isRed
          ? "text-white dark:text-white"
          : isRed ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"
      }>
        <span className="font-medium text-base">{card.rank}</span>
        <span className="ml-0.5 text-sm">{card.suit}</span>
      </span>
    </button>
  );
}
