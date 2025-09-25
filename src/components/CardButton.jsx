import { formatCard } from "../lib/deck";

export default function CardButton({ card, disabled=false, selected=false, onToggle }) {
  const isRed = card.suitKey === "H" || card.suitKey === "D";
  return (
    <button
      onClick={() => !disabled && onToggle?.(card)}
      className={[
        "border-0 relative w-16 h-24 sm:w-16 sm:h-24 lg:w-20 lg:h-28",
        "rounded-xl shadow-sm border flex items-center justify-center m-1",
        disabled ? "bg-[var(--color-neutral)] text-gray-400 cursor-not-allowed opacity-50" : "bg-[var(--color-neutral)] hover:shadow-md",
        selected ? "ring-3 ring-[var(--color-selected)]" : "",
      ].join(" ")}
      title={formatCard(card)}
    >
      <span className={isRed ? "text-[var(--color-suit-red)] text-sm sm:text-base lg:text-lg" : "text-[var(--color-suit-black)] text-sm sm:text-base lg:text-lg"}>
        <span className="font-semibold">{card.rank}</span>
        <span className="ml-0.5">{card.suit}</span>
      </span>
    </button>
    
  );
}
