import { HAND_CATEGORY_ORDER } from "./poker-eval";
import { hasSupabaseConfig, supabase } from "./supabaseClient";

/** Minimum completed hands required to unlock leaderboard opt-in. */
const LEADERBOARD_MIN_HANDS = 100;

const EMPTY_STATS = {
  completedHands: 0,
  wins: 0,
  losses: 0,
  winRatePct: 0,
  handBreakdown: [],
};

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function sortHistoryDescending(history) {
  return [...history].sort((left, right) => {
    return new Date(right.completed_at).getTime() - new Date(left.completed_at).getTime();
  });
}

export function buildStatsFromHistory(historyRows) {
  const completedHands = historyRows.length;
  const wins = historyRows.filter((row) => row.outcome === "win").length;
  const losses = historyRows.filter((row) => row.outcome === "loss").length;
  const winRatePct = completedHands ? Number(((wins / completedHands) * 100).toFixed(1)) : 0;
  const handCountMap = new Map(HAND_CATEGORY_ORDER.map((category) => [category, 0]));

  for (const row of historyRows) {
    if (!row.player_hand_category) continue;
    handCountMap.set(
      row.player_hand_category,
      (handCountMap.get(row.player_hand_category) ?? 0) + 1
    );
  }

  const handBreakdown = [...handCountMap.entries()]
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count);

  return {
    completedHands,
    wins,
    losses,
    winRatePct,
    handBreakdown,
  };
}

export function getDefaultDisplayName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    ""
  );
}

export async function ensureProfileForUser(user) {
  const client = requireSupabase();

  const { data: existingProfile, error: existingError } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const payload = {
    user_id: user.id,
    display_name: getDefaultDisplayName(user) || null,
  };

  const { error: insertError } = await client
    .from("profiles")
    .insert(payload);

  if (insertError) {
    throw insertError;
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileSettings(userId, updates) {
  const client = requireSupabase();
  const payload = {
    display_name: updates.displayName || null,
    leaderboard_name: updates.leaderboardName || null,
    leaderboard_opt_in: Boolean(updates.leaderboardOptIn),
    leaderboard_opted_in_at: updates.leaderboardOptIn ? new Date().toISOString() : null,
  };

  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchLeaderboard(limit = 12) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("leaderboard_candidates")
    .select("user_id, display_name, completed_hands, wins, losses, win_rate_pct, last_completed_at")
    .order("win_rate_pct", { ascending: false })
    .order("completed_hands", { ascending: false })
    .order("last_completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchAccountSnapshot(userId) {
  const client = requireSupabase();
  const [{ data: profile, error: profileError }, { data: historyRows, error: historyError }] =
    await Promise.all([
      client.from("profiles").select("*").eq("user_id", userId).single(),
      client
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
        .order("completed_at", { ascending: false }),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (historyError) {
    throw historyError;
  }

  let rank = null;

  try {
    const top50 = await fetchLeaderboard(50);
    const index = top50.findIndex((row) => row.user_id === userId);
    if (index !== -1) {
      rank = index + 1;
    }
  } catch {
    // rank stays null
  }

  const history = sortHistoryDescending(historyRows ?? []);

  return {
    profile,
    history,
    stats: buildStatsFromHistory(history),
    rank,
  };
}

export async function saveCompletedGameRecord({ userId, summary }) {
  const client = requireSupabase();

  const { data: existing, error: existingError } = await client
    .from("game_sessions")
    .select("id")
    .eq("user_id", userId)
    .contains("metadata", { local_game_id: summary.localGameId })
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  if (existing?.length) {
    return existing[0];
  }

  const completedAt = new Date().toISOString();

  const { data: sessionRow, error: sessionError } = await client
    .from("game_sessions")
    .insert({
      user_id: userId,
      status: "completed",
      client_version: "web-client-v1",
      deck_order: summary.deckOrderIds,
      turns_played: summary.turnLog.length,
      started_at: summary.startedAt,
      completed_at: completedAt,
      player_cards: summary.playerCardIds,
      dealer_cards: summary.dealerCardIds,
      remaining_cards: summary.remainingCardIds,
      player_hand_category: summary.playerHandCategory,
      player_hand_name: summary.playerHandName,
      dealer_hand_category: summary.dealerHandCategory,
      dealer_hand_name: summary.dealerHandName,
      outcome: summary.outcome,
      dealer_won_tie: summary.dealerWonTie,
      metadata: {
        local_game_id: summary.localGameId,
        source: "client_recorded_v1",
      },
    })
    .select("id")
    .single();

  if (sessionError) {
    throw sessionError;
  }

  if (summary.turnLog.length > 0) {
    const turnRows = summary.turnLog.map((turn) => ({
      game_session_id: sessionRow.id,
      turn_index: turn.turnIndex,
      selection_ids: turn.selectionIds,
      dealer_card_ids: turn.result.dealerCardIds,
      player_card_id: turn.result.playerCardId,
      top_up_card_ids: turn.result.topUpCardIds,
    }));

    const { error: turnError } = await client.from("game_turns").insert(turnRows);

    if (turnError) {
      throw turnError;
    }
  }

  return sessionRow;
}

export { EMPTY_STATS, LEADERBOARD_MIN_HANDS };
