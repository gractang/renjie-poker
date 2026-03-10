import CardButton from "./CardButton";
import { SUITS, SUIT_KEYS, RANKS, cardId, isRedSuit } from "../lib/deck";

export default function SelectionGrid({ remainingIds, selection, onToggle, disabled = false }) {
  return (
    <div className="space-y-1">
      {SUIT_KEYS.map((suitKey, i) => (
        <SuitRow
          key={suitKey}
          suitKey={suitKey}
          suitSymbol={SUITS[i]}
          remainingIds={remainingIds}
          selection={selection}
          onToggle={onToggle}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function SuitRow({ suitKey, suitSymbol, remainingIds, selection, onToggle, disabled }) {
  const availableCount = RANKS.filter((rank) =>
    remainingIds.has(cardId({ rank, suit: suitSymbol, suitKey, rVal: RANKS.indexOf(rank) + 2 }))
  ).length;

  return (
    <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]/72 p-2 md:rounded-none md:border-0 md:bg-transparent md:p-0">
      <div className="mb-2 flex items-center justify-between px-1 md:hidden" style={{ fontFamily: "'DM Mono', monospace" }}>
        <span className={`text-sm ${isRedSuit({ suitKey }) ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"}`}>
          {suitSymbol}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {availableCount} live
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 md:flex md:flex-nowrap md:gap-1 md:overflow-x-auto">
        {RANKS.map((rank) => {
          const card = { rank, suit: suitSymbol, suitKey, rVal: RANKS.indexOf(rank) + 2 };
          const id = cardId(card);
          const cardDisabled = disabled || !remainingIds.has(id);
          const selected = selection.has(id);

          return (
            <div key={id} className="min-w-0 md:w-16 md:shrink-0 lg:w-20">
              <CardButton
                card={card}
                disabled={cardDisabled}
                selected={selected}
                onToggle={onToggle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
