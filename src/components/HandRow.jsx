import { cardId } from "../lib/deck";

export default function HandRow({ title, cards, highlightBest = null }) {
  const bestIds = new Set((highlightBest || []).map(cardId));
  return (
    <div className="mb-4">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="flex flex-wrap">
        {cards.map((c, i) => (
          <div key={i}
            className={[
              "card-display-theme",
              (c.suitKey === "H" || c.suitKey === "D") ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]",
              bestIds.has(cardId(c)) ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-300"
            ].join(" ")}
            title={`${c.rank}${c.suit}`}>
            <span className="font-semibold">{c.rank}</span>
            <span className="ml-0.5">{c.suit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
