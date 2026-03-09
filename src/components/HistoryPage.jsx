import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import SiteFooter from "./SiteFooter";

function formatCategory(category) {
  return category.replaceAll("-", " ");
}

function formatDate(value) {
  if (!value) return "not yet";
  return new Date(value).toLocaleString();
}

function HistoryRow({ row }) {
  const won = row.outcome === "win";

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

export default function HistoryPage({ onBack, userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId || !supabase) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("game_sessions")
        .select(`
          id,
          completed_at,
          outcome,
          player_hand_name,
          player_hand_category,
          dealer_hand_name,
          dealer_hand_category,
          dealer_won_tie,
          turns_played
        `)
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (fetchError) throw fetchError;
      setRows(data ?? []);
    } catch (err) {
      setError(err.message ?? "Could not load history.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-4">
          <button className="btn-theme" onClick={onBack}>
            &larr; back
          </button>
          <h1
            className="text-sm uppercase tracking-widest text-[var(--color-text-muted)]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Hand History
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-5 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h2 className="text-lg tracking-tight">All completed hands</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Only completed showdowns are recorded. Mid-game resets stay out of your stats.
            </p>
          </div>

          {loading ? (
            <div className="text-sm text-[var(--color-text-muted)]">Loading history...</div>
          ) : error ? (
            <div className="text-sm text-[var(--color-text-muted)]">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)]">No completed hands yet.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <HistoryRow key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </div>

      <SiteFooter className="border-t border-[var(--color-border)]" />
    </div>
  );
}
