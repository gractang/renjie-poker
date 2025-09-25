// components/SelectionGrid.jsx
import CardButton from "./CardButton";
import { SUITS, SUIT_KEYS, RANKS, cardId } from "../lib/deck";

export default function SelectionGrid({ remainingIds, selection, onToggle, onSelectSuit }) {
    return (
        <div className="space-y-3">
            {SUIT_KEYS.map((suitKey, i) => (
                <SuitRow
                    key={suitKey}
                    suitKey={suitKey}
                    suitSymbol={SUITS[i]}
                    remainingIds={remainingIds}
                    selection={selection}
                    onToggle={onToggle}
                    onSelectSuit={onSelectSuit}
                />
            ))}
        </div>
    );
}

function SuitRow({ suitKey, suitSymbol, remainingIds, selection, onToggle, onSelectSuit }) {
    const isRed = suitKey === "H" || suitKey === "D";

    return (
        <div>
            {/* Row label */}
            {/* <div className="text-sm font-medium mb-1">
                <button
                    className="btn-theme text-xs px-2 py-1"
                    onClick={() => onSelectSuit?.(suitKey)}
                    title={`Select all ${suitSymbol}`}
                > Select all <span className={isRed ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"}>
                        {suitSymbol}
                    </span>
                </button>
            </div> */}


            {/* Horizontal scroller */}
            <div className="overflow-x-auto">
                <div className="flex flex-nowrap pr-1">
                    {RANKS.map((rank) => {
                        const card = { rank, suit: suitSymbol, suitKey, rVal: RANKS.indexOf(rank) + 2 };
                        const id = cardId(card);
                        const disabled = !remainingIds.has(id);       // dealt away → disabled/faded
                        const selected = selection.has(id);            // still can be selected if remaining

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
        </div>
    );
}