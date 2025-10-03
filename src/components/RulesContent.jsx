export default function RulesContent() {
  return (
    <div className="space-y-3 text-sm leading-6">
      <p><strong>Goal:</strong> Build the best 5-card poker hand.</p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>You start with an empty hand. The dealer has a full shuffled deck.</li>
        <li>On each turn, you choose a <em>subset of ranks/suits</em> from the remaining deck. Select <strong> Deal Selected</strong> to deal the cards.</li>
        <li>The dealer deals cards until a card in your subset appears:
          <ul className="list-disc pl-5 mt-1">
            <li>You take that matching card.</li>
            <li>The dealer takes <em>every other</em> card dealt in the process.</li>
          </ul>
        </li>
        <li>Repeat until you have 5 cards.</li>
        <li><strong>Showdown:</strong> Dealer may use <em>any five</em> of their cards; you use your 5.
          Dealer wins ties and must have at least 8 cards (they’ll draw to 8 if short).</li>
      </ol>
      <p className="opacity-80">Tip: Use the suit buttons to quickly select all remaining cards of a suit. You can deselect individual cards anytime.</p>
      
      <div className="mt-6">
        <h3 className="font-semibold text-base mb-3">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <h4 className="font-medium mb-2">Card Selection</h4>
            <div className="space-y-1">
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">S</kbd> Select Spades (♠)</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">H</kbd> Select Hearts (♥)</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">C</kbd> Select Clubs (♣)</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">D</kbd> Select Diamonds (♦)</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">2-9</kbd> Select Rank</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">T</kbd> Select Tens</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">J</kbd> Select Jacks</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Q</kbd> Select Queens</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">K</kbd> Select Kings</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">A</kbd> Select Aces</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Game Actions</h4>
            <div className="space-y-1">
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">0</kbd> Select All</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">X</kbd> Clear Selection</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Enter</kbd> Deal Selected</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">N</kbd> New Game</div>
              <div><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">?</kbd> Show Help</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
