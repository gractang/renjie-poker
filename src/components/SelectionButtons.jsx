import { useMemo } from "react";
import { RANKS, SUITS, SUIT_KEYS, isRedSuit, cardId } from "../lib/deck";

export default function SelectionButtons({
  onSelectSuit,
  onSelectRank,
  onSelectAll,
  onClearSelection,
  onDeal,
  hasSelection,
  canDeal,
  disabled = false,
  buttonFlash,
  selection,
  remaining,
}) {
  const suitButtons = SUIT_KEYS.map((key, index) => ({
    key,
    symbol: SUITS[index],
    isRed: isRedSuit({ suitKey: key }),
  }));

  const rankButtons = RANKS.map(rank => ({
    key: rank,
    symbol: rank,
    isRed: false
  }));

  const activeButtons = useMemo(() => {
    if (!selection || !remaining) return {};
    const active = {};
    // Check each suit
    for (const suitKey of SUIT_KEYS) {
      const suitCards = remaining.filter(c => c.suitKey === suitKey);
      active[`suit-${suitKey}`] = suitCards.length > 0 && suitCards.every(c => selection.has(cardId(c)));
    }
    // Check each rank
    for (const rank of RANKS) {
      const rankCards = remaining.filter(c => c.rank === rank);
      active[`rank-${rank}`] = rankCards.length > 0 && rankCards.every(c => selection.has(cardId(c)));
    }
    // Check all
    active.selectAll = remaining.length > 0 && remaining.every(c => selection.has(cardId(c)));
    return active;
  }, [selection, remaining]);

  const activeClass = (key) =>
    activeButtons[key] ? 'bg-[var(--color-accent)] text-[var(--color-background)] border-[var(--color-accent)]' : '';

  const flashClass = (key) =>
    buttonFlash[key] ? 'bg-[var(--color-accent)] text-[var(--color-background)] border-[var(--color-accent)]' : '';

  return (
    <div className="w-full space-y-3 md:space-y-2">
      {/* Top row: Deal + actions */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-1.5">
        <button
          className={`btn-theme col-span-2 justify-center md:col-span-1 ${hasSelection && canDeal ? 'cta-glow border-[var(--color-accent)] text-[var(--color-accent)]' : 'opacity-30 cursor-not-allowed'} ${flashClass('deal')}`}
          onClick={hasSelection && canDeal ? onDeal : undefined}
          disabled={!hasSelection || !canDeal}
        >
          deal
        </button>
        <span className="hidden h-5 w-px bg-[var(--color-border)] md:block" />
        <button className={`btn-theme ${activeClass('selectAll')} ${flashClass('selectAll')} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={disabled ? undefined : onSelectAll} disabled={disabled}>all</button>
        <button className={`btn-theme ${flashClass('clear')} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={disabled ? undefined : onClearSelection} disabled={disabled}>clear</button>
      </div>

      {/* Suits + ranks */}
      <div className="space-y-3 md:flex md:flex-wrap md:items-center md:gap-3 md:space-y-0">
        <div className="space-y-1.5 md:space-y-0">
          <div className="px-0.5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] md:hidden" style={{ fontFamily: "'DM Mono', monospace" }}>
            Suits
          </div>
          <div className="grid grid-cols-4 gap-1.5 md:flex md:flex-wrap md:items-center md:gap-1">
            {suitButtons.map(b => (
              <button
                key={b.key}
                className={`btn-theme justify-center ${b.isRed && !activeButtons[`suit-${b.key}`] ? 'text-[var(--color-suit-red)]' : ''} ${activeClass(`suit-${b.key}`)} ${flashClass(`suit-${b.key}`)} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={disabled ? undefined : () => onSelectSuit(b.key)}
                disabled={disabled}
              >
                {b.symbol}
              </button>
            ))}
          </div>
        </div>

        <span className="hidden h-5 w-px bg-[var(--color-border)] md:block" />

        <div className="space-y-1.5 md:space-y-0">
          <div className="px-0.5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] md:hidden" style={{ fontFamily: "'DM Mono', monospace" }}>
            Ranks
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:flex md:flex-wrap md:items-center md:gap-1">
            {rankButtons.map(b => (
              <button
                key={b.key}
                className={`btn-theme justify-center ${activeClass(`rank-${b.key}`)} ${flashClass(`rank-${b.key}`)} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={disabled ? undefined : () => onSelectRank(b.key)}
                disabled={disabled}
              >
                {b.symbol}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
