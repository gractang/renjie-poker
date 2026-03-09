export default function RulesContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text)]">
      <p><strong>Goal:</strong> Build the best 5-card poker hand.</p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>You start with an empty hand and a full shuffled deck.</li>
        <li>On each turn, choose a <em>subset of ranks/suits</em> from the remaining deck, then select deal.</li>
        <li>Cards are dealt from the deck until a card in your subset appears:
          <ul className="list-disc pl-5 mt-1 text-[var(--color-text-muted)]">
            <li>You take that matching card.</li>
            <li>The dealer takes every other card dealt.</li>
          </ul>
        </li>
        <li>Repeat until you have 5 cards.</li>
        <li><strong>Showdown:</strong> Dealer uses their best five; you use yours. Dealer wins ties and must have at least 8 cards.</li>
      </ol>

      <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <h3 className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
          Keyboard
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">suits</span><span>s h c d</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">ranks</span><span>2-9 t j q k a</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">all</span><span>0</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">clear</span><span>x</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">deal</span><span>enter</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">new game</span><span>n</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">help</span><span>?</span></div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <h3 className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
          About
        </h3>
        <p className="text-[var(--color-text-muted)]">
          Read{" "}
          <a
            href="/about.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent)]"
          >
            the full story
          </a>{" "}
          behind the game.
        </p>
      </div>
    </div>
  );
}
