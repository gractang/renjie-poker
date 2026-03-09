import { cardId } from "../lib/deck";

export default function HandRow({ cards, highlightBest = null }) {
  const bestIds = new Set((highlightBest || []).map(cardId));
  return (
    <div className="mb-2">
      <div className="flex flex-wrap gap-1">
        {cards.map((c, i) => (
          <div
            key={i}
            className={[
              "card-display-theme text-sm",
              (c.suitKey === "H" || c.suitKey === "D")
                ? "text-[var(--color-suit-red)]"
                : "text-[var(--color-suit-black)]",
              bestIds.has(cardId(c))
                ? "ring-2 ring-[var(--color-selected)]"
                : "",
            ].join(" ")}
            title={`${c.rank}${c.suit}`}
          >
            <span className="font-medium">{c.rank}</span>
            <span className="ml-0.5 text-xs opacity-70">{c.suit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
