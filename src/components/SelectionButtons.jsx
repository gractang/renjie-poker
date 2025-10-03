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
  // Generate suit buttons from constants, avoiding magic values
  const suitButtons = SUIT_KEYS.map((key, index) => ({
    key,
    symbol: SUITS[index],
    isRed: key === "H" || key === "D" // Hearts and Diamonds are red
  }));

  const rankButtons = RANKS.map(rank => ({
    key: rank,
    symbol: rank,
    isRed: false
  }));

  const renderButton = (button, onClick, flashKey = null) => (
    <button 
      key={button.key}
      className={`btn-theme ${button.isRed ? 'text-[var(--color-suit-red)]' : ''} ${flashKey && buttonFlash[flashKey] ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
      onClick={onClick}
    >
      {button.symbol}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Deal Selected button - always visible */}
      <button 
        ref={dealButtonRef}
        className={`btn-theme ${hasSelection ? 'border-2 border-blue-500' : 'opacity-50 cursor-not-allowed'} ${buttonFlash.deal ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
        onClick={hasSelection ? onDeal : undefined}
        disabled={!hasSelection || !canDeal}
        title={!hasSelection ? "Select cards first to enable deal" : !canDeal ? "Player already has 5 cards" : "Deal selected cards (or press Enter)"}
      >
        Deal Selected
      </button>
      
      {/* Suit buttons */}
      <div className="flex items-center gap-2">
        {suitButtons.map(button => 
          renderButton(button, () => onSelectSuit(button.key), `suit-${button.key}`)
        )}
      </div>
      
      {/* Rank buttons */}
      <div className="flex items-center gap-1">
        {rankButtons.map(button => 
          renderButton(button, () => onSelectRank(button.key), `rank-${button.key}`)
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button 
          className={`btn-theme ${buttonFlash.selectAll ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
          onClick={onSelectAll}
        >
          Select All
        </button>
        <button 
          className={`btn-theme ${buttonFlash.clear ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
          onClick={onClearSelection}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

