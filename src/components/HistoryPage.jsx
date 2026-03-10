import { useCallback, useEffect, useState } from "react";
import { fetchHistory } from "../lib/accountData";
import HistoryRow from "./HistoryRow";
import SiteFooter from "./SiteFooter";

export default function HistoryPage({ onBack, userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      setRows(await fetchHistory(userId));
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
