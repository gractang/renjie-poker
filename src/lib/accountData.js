import { HAND_CATEGORY_ORDER } from "./poker-eval";
import { hasSupabaseConfig, supabase } from "./supabaseClient";

const EMPTY_STATS = {
  completedHands: 0,
  wins: 0,
  losses: 0,
  winRatePct: 0,
  handBreakdown: [],
};

const APP_CONFIG_ROW_ID = 1;

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
    return { profile: existingProfile, isNew: false };
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

  return { profile: data, isNew: true };
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

export async function fetchAppConfig() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("app_config")
    .select("leaderboard_min_hands")
    .eq("id", APP_CONFIG_ROW_ID)
    .single();

  if (error) {
    throw error;
  }

  if (typeof data?.leaderboard_min_hands !== "number") {
    throw new Error("Leaderboard config is missing.");
  }

  return {
    leaderboardMinHands: data.leaderboard_min_hands,
  };
}

export async function fetchLeaderboard(limit = 50) {
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

export async function fetchHistory(userId) {
  const client = requireSupabase();
  const { data, error } = await client
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

  if (error) {
    throw error;
  }

  return sortHistoryDescending(data ?? []);
}

export async function clearCompletedHistory(userId) {
  const client = requireSupabase();

  const { data: completedRows, error: completedError } = await client
    .from("game_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (completedError) {
    throw completedError;
  }

  const sessionIds = (completedRows ?? []).map((row) => row.id);
  if (!sessionIds.length) {
    return { clearedCount: 0 };
  }

  const { data: deletedRows, error: deleteError } = await client
    .from("game_sessions")
    .delete()
    .in("id", sessionIds)
    .select("id");

  if (deleteError) {
    throw deleteError;
  }

  const deletedCount = deletedRows?.length ?? 0;
  if (deletedCount === sessionIds.length) {
    return { clearedCount: deletedCount };
  }

  const clearedAt = new Date().toISOString();
  const { data: updatedRows, error: updateError } = await client
    .from("game_sessions")
    .update({
      status: "abandoned",
      abandoned_at: clearedAt,
      completed_at: null,
      player_hand_category: null,
      player_hand_name: null,
      dealer_hand_category: null,
      dealer_hand_name: null,
      outcome: null,
      player_cards: null,
      dealer_cards: null,
      remaining_cards: null,
      metadata: { source: "history_cleared_v1", cleared_at: clearedAt },
    })
    .in("id", sessionIds)
    .select("id");

  if (updateError) {
    throw updateError;
  }

  return { clearedCount: updatedRows?.length ?? 0 };
}

export async function fetchAccountSnapshot(userId) {
  const client = requireSupabase();
  const [{ data: profile, error: profileError }, history] =
    await Promise.all([
      client.from("profiles").select("*").eq("user_id", userId).single(),
      fetchHistory(userId),
    ]);

  if (profileError) {
    throw profileError;
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

  return {
    profile,
    history,
    stats: buildStatsFromHistory(history),
    rank,
  };
}

async function insertGameTurns(client, sessionId, turnLog) {
  if (!turnLog.length) return;

  const turnRows = turnLog.map((turn) => ({
    game_session_id: sessionId,
    turn_index: turn.turnIndex,
    selection_ids: turn.selectionIds,
    dealer_card_ids: turn.result.dealerCardIds,
    player_card_id: turn.result.playerCardId,
    top_up_card_ids: turn.result.topUpCardIds,
  }));

  const { error } = await client.from("game_turns").insert(turnRows);

  if (error) {
    throw error;
  }
}

export async function saveInProgressGame({ userId, game }) {
  const client = requireSupabase();

  const payload = {
    user_id: userId,
    status: "in_progress",
    client_version: "web-client-v1",
    deck_order: game.deckOrderIds,
    turns_played: game.turnsPlayed,
    started_at: game.startedAt,
    player_cards: game.playerCardIds,
    dealer_cards: game.dealerCardIds,
    remaining_cards: game.remainingCardIds,
    metadata: {
      local_game_id: game.localGameId,
      source: "client_recorded_v1",
      turn_log: game.turnLog,
    },
  };

  const { data: existing } = await client
    .from("game_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .limit(1);

  if (existing?.length) {
    const { error } = await client
      .from("game_sessions")
      .update(payload)
      .eq("id", existing[0].id);

    if (error) throw error;

    return existing[0];
  }

  const { data, error } = await client
    .from("game_sessions")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  return data;
}

export async function fetchInProgressGame(userId) {
  const client = requireSupabase();

  const { data, error } = await client
    .from("game_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveCompletedGameRecord({ userId, summary }) {
  const client = requireSupabase();

  const { data: existing, error: existingError } = await client
    .from("game_sessions")
    .select("id, status")
    .eq("user_id", userId)
    .contains("metadata", { local_game_id: summary.localGameId })
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  const completedAt = new Date().toISOString();

  const completedFields = {
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
  };

  if (existing?.length) {
    if (existing[0].status === "completed") {
      return existing[0];
    }

    const { data, error } = await client
      .from("game_sessions")
      .update(completedFields)
      .eq("id", existing[0].id)
      .select("id")
      .single();

    if (error) throw error;

    await insertGameTurns(client, data.id, summary.turnLog);

    return data;
  }

  const { data: sessionRow, error: sessionError } = await client
    .from("game_sessions")
    .insert({ user_id: userId, ...completedFields })
    .select("id")
    .single();

  if (sessionError) {
    throw sessionError;
  }

  await insertGameTurns(client, sessionRow.id, summary.turnLog);

  return sessionRow;
}

export { EMPTY_STATS };
