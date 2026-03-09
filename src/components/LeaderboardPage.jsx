import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, LEADERBOARD_MIN_HANDS } from "../lib/accountData";
import SiteFooter from "./SiteFooter";

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export default function LeaderboardPage({ onBack, standalone }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLeaderboard();
      setRows(data);
    } catch (err) {
      setError(err.message ?? "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-4">
          {standalone ? (
            <a href="/" className="btn-theme">
              &larr; play
            </a>
          ) : (
            <button className="btn-theme" onClick={onBack}>
              &larr; back
            </button>
          )}
          <h1
            className="text-sm uppercase tracking-widest text-[var(--color-text-muted)]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Leaderboard
          </h1>
        </div>
        <button className="btn-theme" onClick={load} disabled={loading}>
          refresh
        </button>
      </header>

      <div className="flex-1 overflow-auto px-5 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h2 className="text-lg tracking-tight">Public top table</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Only players who opted in with at least {LEADERBOARD_MIN_HANDS} completed hands appear here.
            </p>
          </div>

          {loading ? (
            <div className="text-sm text-[var(--color-text-muted)]">Loading leaderboard...</div>
          ) : error ? (
            <div className="text-sm text-[var(--color-text-muted)]">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)]">No public leaderboard entries yet.</div>
          ) : (
            <div className="overflow-hidden border border-[var(--color-border)]">
              <div
                className="grid grid-cols-[52px_1fr_88px_80px] border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                <div>rank</div>
                <div>player</div>
                <div>win rate</div>
                <div>hands</div>
              </div>
              {rows.map((row, index) => (
                <div
                  key={row.user_id}
                  className="grid grid-cols-[52px_1fr_88px_80px] items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm last:border-b-0"
                >
                  <div className="text-[var(--color-text-muted)]">#{index + 1}</div>
                  <div>{row.display_name || "anonymous"}</div>
                  <div>{formatPercent(row.win_rate_pct)}</div>
                  <div>{row.completed_hands}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SiteFooter className="border-t border-[var(--color-border)]" />
    </div>
  );
}
