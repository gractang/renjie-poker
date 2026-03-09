export default function AboutContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-[var(--color-text)]">
      <section>
        <h3
          className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          The Game
        </h3>
        <p>
          Renjie Poker was created by{" "}
          <strong>[Game Creator Name]</strong>.{" "}
          {/* TODO: Replace with the origin story */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Describe the
          origin of the game here — how it was invented, the strategy behind it,
          and what makes it unique.
        </p>
      </section>

      <section>
        <h3
          className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          The Website
        </h3>
        <p>
          This digital version was built by{" "}
          <strong>Grace Tang</strong>.
        </p>
      </section>
    </div>
  );
}
