import { RANKS, SUITS, SUIT_KEYS } from "../lib/deck";

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
          className={`btn-theme ${hasSelection ? 'bg-[var(--color-accent)] text-[var(--color-background)] border-[var(--color-accent)]' : 'opacity-30 cursor-not-allowed'} ${flashClass('deal')}`}
          onClick={hasSelection && canDeal ? onDeal : undefined}
          disabled={!hasSelection || !canDeal}
        >
          deal
        </button>
        <span className="w-px h-5 bg-[var(--color-border)]" />
        <button className={`btn-theme ${flashClass('selectAll')} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={disabled ? undefined : onSelectAll} disabled={disabled}>all</button>
        <button className={`btn-theme ${flashClass('clear')} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={disabled ? undefined : onClearSelection} disabled={disabled}>clear</button>
      </div>

      {/* Suits */}
      <div className="flex items-center gap-1 flex-wrap">
        {suitButtons.map(b => (
          <button
            key={b.key}
            className={`btn-theme ${b.isRed ? 'text-[var(--color-suit-red)]' : ''} ${flashClass(`suit-${b.key}`)} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={disabled ? undefined : () => onSelectSuit(b.key)}
            disabled={disabled}
          >
            {b.symbol}
          </button>
        ))}
        <span className="w-px h-5 bg-[var(--color-border)]" />
        {rankButtons.map(b => (
          <button
            key={b.key}
            className={`btn-theme ${flashClass(`rank-${b.key}`)} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={disabled ? undefined : () => onSelectRank(b.key)}
            disabled={disabled}
          >
            {b.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
