import { formatCard, isRedSuit } from "../lib/deck";

export default function CardButton({ card, disabled = false, selected = false, onToggle }) {
  const isRed = isRedSuit(card);

  return (
    <button
      onClick={() => !disabled && onToggle?.(card)}
      className={[
        "relative w-full aspect-[2/3] md:h-24 md:aspect-auto lg:h-28",
        "flex items-center justify-center overflow-hidden rounded-xl border cursor-pointer touch-manipulation select-none md:rounded",
        "transition-all duration-150 active:scale-[0.98]",
        disabled
          ? "bg-[var(--color-background)] text-[var(--color-border)] cursor-not-allowed opacity-40"
          : selected
            ? "bg-[color-mix(in_srgb,var(--color-selected)_18%,var(--color-surface))] border-[var(--color-selected)] shadow-[inset_0_0_0_2px_var(--color-selected)]"
            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] active:border-[var(--color-accent)] active:bg-[color-mix(in_srgb,var(--color-selected)_14%,var(--color-surface))]",
      ].join(" ")}
      title={formatCard(card)}
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <span className={
        selected
          ? isRed
            ? "text-[var(--color-suit-red)]"
            : "text-[var(--color-selected)]"
          : isRed
            ? "text-[var(--color-suit-red)]"
            : "text-[var(--color-suit-black)]"
      }>
        <span className="text-sm font-medium md:text-base">{card.rank}</span>
        <span className="ml-0.5 text-xs md:text-sm">{card.suit}</span>
      </span>
    </button>
  );
}
