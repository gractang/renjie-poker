import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import HistoryRow from "./HistoryRow";
import {
  EMPTY_STATS,
  fetchAppConfig,
  fetchAccountSnapshot,
  updateProfileSettings,
} from "../lib/accountData";
import { formatCategory, formatPercent } from "../lib/format";

const INPUT_CLASS = "w-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="space-y-2">
      <div
        className="text-[10px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {eyebrow}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base tracking-tight">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="min-w-0 border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
      <div
        className="truncate text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </div>
      <div className="mt-2 truncate text-xl tracking-tight">{value}</div>
      {detail && <div className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{detail}</div>}
    </div>
  );
}

export default function AccountModal({ open, onClose, auth, refreshToken, syncStatus, onOpenLeaderboard, onOpenHistory }) {
  const [localMessage, setLocalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [rank, setRank] = useState(null);
  const [leaderboardMinHands, setLeaderboardMinHands] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    displayName: "",
    leaderboardName: "",
    leaderboardOptIn: false,
  });

  const hasLeaderboardConfig = typeof leaderboardMinHands === "number";
  const leaderboardEligible = hasLeaderboardConfig && stats.completedHands >= leaderboardMinHands;
  const leaderboardProgress = hasLeaderboardConfig
    ? Math.min(100, Math.round((stats.completedHands / leaderboardMinHands) * 100))
    : 0;
  const leaderboardRequirementLabel = hasLeaderboardConfig
    ? `${leaderboardMinHands} completed hands`
    : "the configured completed-hand requirement";
  const title = auth.user ? "Account & History" : "Sign In";

  useEffect(() => {
    setProfileDraft({
      displayName: auth.profile?.display_name ?? "",
      leaderboardName: auth.profile?.leaderboard_name ?? "",
      leaderboardOptIn: Boolean(auth.profile?.leaderboard_opt_in),
    });
  }, [auth.profile]);

  const loadDashboard = useCallback(async () => {
    if (!open || !auth.hasSupabaseConfig) {
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");

    try {
      if (auth.user) {
        const [config, snapshot] = await Promise.all([
          fetchAppConfig(),
          fetchAccountSnapshot(auth.user.id),
        ]);
        setLeaderboardMinHands(config.leaderboardMinHands);
        setHistory(snapshot.history);
        setStats(snapshot.stats);
        setRank(snapshot.rank);
      } else {
        const config = await fetchAppConfig();
        setLeaderboardMinHands(config.leaderboardMinHands);
        setHistory([]);
        setStats(EMPTY_STATS);
        setRank(null);
      }
    } catch (error) {
      setDashboardError(error.message ?? "Could not load account data.");
    } finally {
      setDashboardLoading(false);
    }
  }, [auth.hasSupabaseConfig, auth.user, open]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshToken]);

  const topHands = useMemo(() => stats.handBreakdown.slice(0, 5), [stats.handBreakdown]);

  const handleGoogle = async () => {
    setSubmitting(true);
    setLocalMessage("");

    try {
      await auth.signInWithGoogle();
    } catch (error) {
      setLocalMessage(error.message ?? "Could not start Google sign-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async () => {
    if (!auth.user) return;

    setSubmitting(true);
    setLocalMessage("");

    try {
      const nextProfile = await updateProfileSettings(auth.user.id, profileDraft);
      await auth.refreshProfile(auth.user);
      setProfileDraft({
        displayName: nextProfile.display_name ?? "",
        leaderboardName: nextProfile.leaderboard_name ?? "",
        leaderboardOptIn: Boolean(nextProfile.leaderboard_opt_in),
      });
      setLocalMessage("Profile updated.");
      setEditingProfile(false);
      await loadDashboard();
    } catch (error) {
      setLocalMessage(error.message ?? "Could not save profile settings.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaderboardToggle = (checked) => {
    setProfileDraft((prev) => ({
      ...prev,
      leaderboardOptIn: checked,
    }));
  };

  const handleProfileCancel = () => {
    setProfileDraft({
      displayName: auth.profile?.display_name ?? "",
      leaderboardName: auth.profile?.leaderboard_name ?? "",
      leaderboardOptIn: Boolean(auth.profile?.leaderboard_opt_in),
    });
    setEditingProfile(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {!auth.hasSupabaseConfig && (
        <div className="space-y-3 text-sm">
          <SectionHeading eyebrow="Config" title="Supabase keys are still missing">
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Add the variables from <code>.env.example</code> before auth, history, and leaderboard queries can work.
            </p>
          </SectionHeading>
          <div className="border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_PUBLISHABLE_KEY</div>
          </div>
        </div>
      )}

      {auth.hasSupabaseConfig && auth.loading && (
        <div className="text-sm text-[var(--color-text-muted)]">Loading account state...</div>
      )}

      {auth.hasSupabaseConfig && !auth.loading && !auth.user && (
        <div className="space-y-6">
          <div className="border border-[var(--color-border)] bg-[var(--color-background)] p-5">
            <SectionHeading eyebrow="Save Your Run" title="Sign in before your hot streak disappears" />
            <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]" style={{ fontFamily: "'DM Mono', monospace" }}>history</div>
                <div className="mt-2 text-sm text-[var(--color-text-muted)]">Completed hands stay attached to your account.</div>
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]" style={{ fontFamily: "'DM Mono', monospace" }}>stats</div>
                <div className="mt-2 text-sm text-[var(--color-text-muted)]">Win rate and hand frequency update from your saved sessions.</div>
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]" style={{ fontFamily: "'DM Mono', monospace" }}>leaderboard</div>
                <div className="mt-2 text-sm text-[var(--color-text-muted)]">Opt in anytime. You'll appear after {leaderboardRequirementLabel}.</div>
              </div>
            </div>
            <div className="mt-4">
              <button
                className="btn-theme w-full justify-between border-[var(--color-text)] bg-[var(--color-text)] px-4 py-3 text-[var(--color-background)] hover:border-[var(--color-text)] hover:bg-[var(--color-text)]"
                onClick={handleGoogle}
                disabled={submitting}
              >
                <span>continue with google</span>
                <span className="text-xs opacity-70">&rarr;</span>
              </button>
            </div>
          </div>

          {(localMessage || auth.error) && (
            <div className="text-sm text-[var(--color-text-muted)]">{localMessage || auth.error}</div>
          )}
        </div>
      )}

      {auth.hasSupabaseConfig && !auth.loading && auth.user && (
        <div className="space-y-6">
          <div className="border border-[var(--color-border)] bg-[var(--color-background)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div
                  className="text-[10px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Signed In
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <h3 className="text-lg tracking-tight">
                    {profileDraft.displayName || auth.user.email || "player"}
                  </h3>
                  {rank != null && (
                    <button
                      className="rounded-full border border-[var(--color-accent)] bg-transparent px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-background)]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                      onClick={() => { onClose(); onOpenLeaderboard(); }}
                      type="button"
                      title="View leaderboard"
                    >
                      #{rank}
                    </button>
                  )}
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">{auth.user.email}</div>
              </div>
              <div className="space-y-2 text-right">
                {syncStatus?.message && (
                  <div className="text-sm text-[var(--color-text-muted)]">{syncStatus.message}</div>
                )}
                <button className="btn-theme" onClick={auth.signOut} type="button">
                  sign out
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <SectionHeading eyebrow="Profile" title="Identity and public name" />
                {!editingProfile && (
                  <button className="btn-theme shrink-0" onClick={() => setEditingProfile(true)} type="button">
                    edit
                  </button>
                )}
              </div>
              {editingProfile ? (
                <div className="grid gap-3">
                  <input
                    className={INPUT_CLASS}
                    placeholder="display name"
                    value={profileDraft.displayName}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                  />
                  <input
                    className={INPUT_CLASS}
                    placeholder="leaderboard name"
                    value={profileDraft.leaderboardName}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, leaderboardName: event.target.value }))}
                  />
                  <label className="flex items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
                    <span>Show me on the public leaderboard</span>
                    <input
                      type="checkbox"
                      checked={profileDraft.leaderboardOptIn}
                      onChange={(event) => handleLeaderboardToggle(event.target.checked)}
                    />
                  </label>
                  {profileDraft.leaderboardOptIn && !profileDraft.leaderboardName.trim() && (
                    <div className="text-xs text-[var(--color-suit-red)]">A leaderboard name is required to opt in.</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      className={`btn-theme flex-1 justify-between px-4 py-3 ${
                        profileDraft.displayName !== (auth.profile?.display_name ?? "") ||
                        profileDraft.leaderboardName !== (auth.profile?.leaderboard_name ?? "") ||
                        profileDraft.leaderboardOptIn !== Boolean(auth.profile?.leaderboard_opt_in)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-background)]"
                          : ""
                      }`}
                      onClick={handleProfileSave}
                      disabled={submitting || (profileDraft.leaderboardOptIn && !profileDraft.leaderboardName.trim())}
                      type="button"
                    >
                      <span>save profile</span>
                      <span className="text-xs opacity-70">&rarr;</span>
                    </button>
                    <button className="btn-theme px-4 py-3" onClick={handleProfileCancel} disabled={submitting} type="button">
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
                    <span className="text-[var(--color-text-muted)]">display name</span>
                    <span>{profileDraft.displayName || <span className="text-[var(--color-text-muted)]">not set</span>}</span>
                  </div>
                  <div className="flex justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
                    <span className="text-[var(--color-text-muted)]">leaderboard name</span>
                    <span>{profileDraft.leaderboardName || <span className="text-[var(--color-text-muted)]">not set</span>}</span>
                  </div>
                  <div className="flex justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
                    <span className="text-[var(--color-text-muted)]">public leaderboard</span>
                    <span>{profileDraft.leaderboardOptIn ? "opted in" : "not opted in"}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <SectionHeading eyebrow="History" title="Recent completed hands" />
              {dashboardLoading ? (
                <div className="text-sm text-[var(--color-text-muted)]">Loading history...</div>
              ) : dashboardError ? (
                <div className="text-sm text-[var(--color-text-muted)]">{dashboardError}</div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 3).map((row) => (
                    <HistoryRow key={row.id} row={row} />
                  ))}
                  {history.length > 3 && (
                    <button
                      className="btn-theme w-full justify-between px-4 py-2.5"
                      onClick={() => { onClose(); onOpenHistory(); }}
                      type="button"
                    >
                      <span>view all {history.length} hands</span>
                      <span className="text-xs opacity-70">&rarr;</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
                  Finish a hand while signed in and it will land here automatically.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <SectionHeading eyebrow="Stats" title="How your run looks so far" />
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
              <StatCard label="completed hands" value={stats.completedHands} />
              <StatCard label="win rate" value={formatPercent(stats.winRatePct)} />
              <StatCard label="record" value={`${stats.wins}-${stats.losses}`} detail="wins-losses" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Leaderboard progress</span>
                <span className="text-[var(--color-text-muted)]">
                  {hasLeaderboardConfig ? `${stats.completedHands}/${leaderboardMinHands}` : `${stats.completedHands}/...`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-background)]">
                <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${leaderboardProgress}%` }} />
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">
                {leaderboardEligible
                  ? profileDraft.leaderboardOptIn
                    ? "You're on the public leaderboard."
                    : "You have enough hands to appear on the leaderboard. Opt in from your profile."
                  : hasLeaderboardConfig
                    ? `${leaderboardMinHands - stats.completedHands} more completed hands to appear on the leaderboard.`
                    : "Leaderboard requirement is loading."}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm">Most common made hands</div>
              {topHands.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topHands.map((entry) => (
                    <div key={entry.category} className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                      {formatCategory(entry.category)} &middot; {entry.count}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[var(--color-text-muted)]">Finish a few hands and your distribution will appear here.</div>
              )}
            </div>
          </div>

          {(localMessage || auth.error) && (
            <div className="text-sm text-[var(--color-text-muted)]">{localMessage || auth.error}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
