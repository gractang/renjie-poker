import useRenjiePokerEngine from "../engine/useRenjiePokerEngine";
import HandRow from "../components/HandRow";
import SelectionGrid from "../components/SelectionGrid";
import Controls from "../components/Controls";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import RulesContent from "../components/RulesContent";

import { useState } from "react";

export default function App() {
  const eng = useRenjiePokerEngine();
  const {
    player, dealer, message, selection, remainingIds,
    playerEval, dealerEval
  } = eng;

  const [showRules, setShowRules] = useState(false);

  return (
    // Full-screen flex column
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold">Renjie Poker</h1>
        <div className="flex items-center gap-3">
          

          <ThemeToggle />
          <Controls
            onNew={eng.reset}
            onDeal={eng.deal}
            canDeal={player.length < 5}
            canReveal={player.length === 5}
          />
          <button className="btn-theme" onClick={() => setShowRules(true)}>How to Play</button>

        </div>
      </header>

      {/* Scrollable middle section that holds both top and bottom */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4">
        <div className="mb-3 text-sm opacity-80">{message}</div>

        {/* Player + dealer shrink naturally (no forced height) */}
        <section className="flex flex-wrap gap-6 mb-6">
          <div className="flex-1 min-w-[280px]">
            <div className="text-lg font-semibold mb-2">Player ({player.length})</div>
            <HandRow
              title={playerEval ? `Best: ${playerEval.name}` : "Your hand"}
              cards={player}
              highlightBest={playerEval?.bestFive || null}
            />
          </div>

          <div className="flex-1 min-w-[280px]">
            <div className="text-lg font-semibold mb-2">Dealer ({dealer.length})</div>
            <HandRow
              title={dealerEval ? `Best: ${dealerEval.name}` : "Dealer's cards"}
              cards={dealer}
              highlightBest={dealerEval?.bestFive || null}
            />
          </div>
        </section>

        {/* Selection sticks to bottom, but pushes down if tall */}
        <section className="mt-auto sticky bottom-0 border-t bg-[var(--color-background)]/85 backdrop-blur">
          <div className="p-3">
            <div className="text-sm font-medium mb-2">Select Subset (from remaining deck)</div>
            {/* Suit quick-selects */}
            <div className="flex items-center gap-2">
                <button className="btn-theme" onClick={() => eng.selectSuit("S")}>♠</button>
                <button className="btn-theme text-[var(--color-suit-red)]" onClick={() => eng.selectSuit("H")}>♥</button>
                <button className="btn-theme" onClick={() => eng.selectSuit("C")}>♣</button>
                <button className="btn-theme text-[var(--color-suit-red)]" onClick={() => eng.selectSuit("D")}>♦</button>
                {/* New: bulk actions */}
                <button className="btn-theme" onClick={eng.selectAll}>Select All</button>
                <button className="btn-theme" onClick={eng.clearSelection}>Clear</button>
            </div>
            {/* Scrollable grid of remaining cards */}
            <div className="max-h-[50vh] overflow-y-auto">
              <SelectionGrid
                remainingIds={remainingIds}
                selection={selection}
                onToggle={eng.toggleSelect}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Modal mount */}
      <Modal open={showRules} onClose={() => setShowRules(false)} title="How to Play">
        <RulesContent />
      </Modal>
    </div>
  );
}
