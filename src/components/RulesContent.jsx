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
    </div>
  );
}
