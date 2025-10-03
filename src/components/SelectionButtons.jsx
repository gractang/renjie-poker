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
    <div className="w-full">
      {/* Deal Selected button - full width on mobile, auto on desktop */}
      <button 
        ref={dealButtonRef}
        className={`btn-theme w-full md:w-auto ${hasSelection ? 'border-2 border-blue-500' : 'opacity-50 cursor-not-allowed'} ${buttonFlash.deal ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
        onClick={hasSelection ? onDeal : undefined}
        disabled={!hasSelection || !canDeal}
        title={!hasSelection ? "Select cards first to enable deal" : !canDeal ? "Player already has 5 cards" : "Deal selected cards (or press Enter)"}
      >
        Deal Selected
      </button>
      
      {/* Responsive button groups */}
      <div className="space-y-3 mt-3">
        {/* Suit buttons - responsive layout */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-gray-600">Suits</h4>
          <div className="flex items-center gap-1 flex-wrap md:justify-start">
            {suitButtons.map(button => 
              renderButton(button, () => onSelectSuit(button.key), `suit-${button.key}`)
            )}
          </div>
        </div>
        
        {/* Rank buttons - natural wrap, full width on desktop */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-gray-600">Ranks</h4>
          <div className="flex items-center gap-1 flex-wrap md:justify-start">
            {rankButtons.map(button => 
              renderButton(button, () => onSelectRank(button.key), `rank-${button.key}`)
            )}
          </div>
        </div>
        
        {/* Action buttons - responsive layout */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-gray-600">Actions</h4>
          <div className="flex gap-1 md:justify-start">
            <button 
              className={`btn-theme w-auto ${buttonFlash.selectAll ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
              onClick={onSelectAll}
            >
              Select All
            </button>
            <button 
              className={`btn-theme w-auto ${buttonFlash.clear ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
              onClick={onClearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

