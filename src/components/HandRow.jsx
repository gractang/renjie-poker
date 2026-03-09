import { cardId } from "../lib/deck";

export default function HandRow({ cards, highlightBest = null, wrap = false }) {
  const bestIds = new Set((highlightBest || []).map(cardId));

  return (
    <div className={wrap ? "mb-2 p-1" : "mb-2 overflow-x-auto p-1"}>
      <div
        className={wrap ? "flex min-h-16 flex-wrap gap-1" : "flex min-h-16 min-w-max flex-nowrap gap-1"}
        data-hand-row
        data-wrap={wrap ? "true" : "false"}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            data-hand-card
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
