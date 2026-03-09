import { RANKS, SUITS, SUIT_KEYS } from "../lib/deck";

export default function SelectionButtons({
  onSelectSuit,
  onSelectRank,
  onSelectAll,
  onClearSelection,
  onDeal,
  hasSelection,
  canDeal,
  buttonFlash,
  dealButtonRef
}) {
  const suitButtons = SUIT_KEYS.map((key, index) => ({
    key,
    symbol: SUITS[index],
    isRed: key === "H" || key === "D"
  }));

  const rankButtons = RANKS.map(rank => ({
    key: rank,
    symbol: rank,
    isRed: false
  }));

  const flashClass = (key) =>
    buttonFlash[key] ? 'bg-[var(--color-accent)] text-[var(--color-background)] border-[var(--color-accent)]' : '';

  return (
    <div className="w-full space-y-2">
      {/* Top row: Deal + actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          ref={dealButtonRef}
          className={`btn-theme ${hasSelection ? 'bg-[var(--color-accent)] text-[var(--color-background)] border-[var(--color-accent)]' : 'opacity-30 cursor-not-allowed'} ${flashClass('deal')}`}
          onClick={hasSelection ? onDeal : undefined}
          disabled={!hasSelection || !canDeal}
        >
          deal
        </button>
        <span className="w-px h-5 bg-[var(--color-border)]" />
        <button className={`btn-theme ${flashClass('selectAll')}`} onClick={onSelectAll}>all</button>
        <button className={`btn-theme ${flashClass('clear')}`} onClick={onClearSelection}>clear</button>
      </div>

      {/* Suits */}
      <div className="flex items-center gap-1 flex-wrap">
        {suitButtons.map(b => (
          <button
            key={b.key}
            className={`btn-theme ${b.isRed ? 'text-[var(--color-suit-red)]' : ''} ${flashClass(`suit-${b.key}`)}`}
            onClick={() => onSelectSuit(b.key)}
          >
            {b.symbol}
          </button>
        ))}
        <span className="w-px h-5 bg-[var(--color-border)]" />
        {rankButtons.map(b => (
          <button
            key={b.key}
            className={`btn-theme ${flashClass(`rank-${b.key}`)}`}
            onClick={() => onSelectRank(b.key)}
          >
            {b.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
