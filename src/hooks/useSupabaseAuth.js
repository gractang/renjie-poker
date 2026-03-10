import { useCallback, useEffect, useState } from "react";
import { ensureProfileForUser } from "../lib/accountData";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

const AUTH_RELOAD_MARKER_KEY = "renjie:auth-reload-at";
const AUTH_RELOAD_COOLDOWN_MS = 4000;
const GAME_STATE_STORAGE_KEYS = [
  "renjie:game-state",
  "renjie-poker:game-state",
  "renjie-poker:active-game",
  "renjie-game-state",
];

function clearSavedGameState() {
  if (typeof window === "undefined") return;

  for (const key of GAME_STATE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

function shouldReloadAfterAuthTransition() {
  if (typeof window === "undefined") return false;

  const previous = Number.parseInt(window.sessionStorage.getItem(AUTH_RELOAD_MARKER_KEY) || "", 10);
  const now = Date.now();

  if (Number.isFinite(previous) && now - previous < AUTH_RELOAD_COOLDOWN_MS) {
    return false;
  }

  window.sessionStorage.setItem(AUTH_RELOAD_MARKER_KEY, `${now}`);
  return true;
}

export default function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async (nextUser) => {
    if (!supabase || !nextUser) {
      setProfile(null);
      return null;
    }

    const nextProfile = await ensureProfileForUser(nextUser);
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);

      if (data.session?.user) {
        try {
          await refreshProfile(data.session.user);
        } catch (profileError) {
          if (active) {
            setError(profileError.message ?? "Could not load your profile.");
          }
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (!nextSession?.user) {
        setProfile(null);
      } else {
        queueMicrotask(async () => {
          try {
            await refreshProfile(nextSession.user);
          } catch (profileError) {
            if (active) {
              setError(profileError.message ?? "Could not refresh your profile.");
            }
          }
        });
      }

      if ((event === "SIGNED_IN" || event === "SIGNED_OUT") && shouldReloadAfterAuthTransition()) {
        clearSavedGameState();
        window.location.reload();
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");

    setError("");

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }
  }, []);

  return {
    hasSupabaseConfig,
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    refreshProfile,
    signInWithGoogle,
    signOut,
  };
}
