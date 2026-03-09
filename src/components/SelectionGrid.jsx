import CardButton from "./CardButton";
import { SUITS, SUIT_KEYS, RANKS, cardId } from "../lib/deck";

export default function SelectionGrid({ remainingIds, selection, onToggle }) {
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
        />
      ))}
    </div>
  );
}

function SuitRow({ suitKey, suitSymbol, remainingIds, selection, onToggle }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-nowrap">
        {RANKS.map((rank) => {
          const card = { rank, suit: suitSymbol, suitKey, rVal: RANKS.indexOf(rank) + 2 };
          const id = cardId(card);
          const disabled = !remainingIds.has(id);
          const selected = selection.has(id);

          return (
            <div key={id} className="shrink-0">
              <CardButton
                card={card}
                disabled={disabled}
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
