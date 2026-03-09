import { formatCard } from "../lib/deck";

export default function CardButton({ card, disabled = false, selected = false, onToggle }) {
  const isRed = card.suitKey === "H" || card.suitKey === "D";
  return (
    <button
      onClick={() => !disabled && onToggle?.(card)}
      className={[
        "relative w-full aspect-[2/3] md:h-24 md:aspect-auto lg:h-28",
        "flex items-center justify-center rounded-xl border cursor-pointer touch-manipulation select-none md:rounded",
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
        <span className="text-sm font-medium md:text-base">{card.rank}</span>
        <span className="ml-0.5 text-xs md:text-sm">{card.suit}</span>
      </span>
    </button>
  );
}
