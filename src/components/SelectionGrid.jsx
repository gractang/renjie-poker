import CardButton from "./CardButton";
import { cardId, makeDeck } from "../lib/deck";
import { useMemo } from "react";

export default function SelectionGrid({ remainingIds, selection, onToggle }) {
    // Build the list once per remainingIds change
  const remainingCards = useMemo(() => {
    const ids = remainingIds; // Set<string>
    return makeDeck().filter((c) => ids.has(cardId(c)));
  }, [remainingIds]);
  
  return (
    <div className="flex flex-wrap">
      {remainingCards.map((c, idx) => (
        <CardButton
          key={idx}
          card={c}
          disabled={!remainingIds.has(cardId(c))}
          selected={selection.has(cardId(c))}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
