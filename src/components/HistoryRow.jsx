import { formatCategory, formatDate } from "../lib/format";

export default function HistoryRow({ row }) {
  const won = row.outcome === "win";
  const isLoss = !won && !row.dealer_won_tie;

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm">
            {row.player_hand_name}
            <span className="text-[var(--color-text-muted)]"> vs {row.dealer_hand_name}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
            {formatDate(row.completed_at)}
          </div>
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
            won
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : isLoss
                ? "border-[var(--color-suit-red)] text-[var(--color-suit-red)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {won ? "win" : row.dealer_won_tie ? "dealer tie" : "loss"}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)]">
        <span>{formatCategory(row.player_hand_category)}</span>
        <span>&middot;</span>
        <span>{row.turns_played} turns</span>
      </div>
    </div>
  );
}
