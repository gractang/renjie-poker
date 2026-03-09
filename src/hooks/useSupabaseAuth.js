import { useCallback, useEffect, useState } from "react";
import { ensureProfileForUser } from "../lib/accountData";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (!nextSession?.user) {
        setProfile(null);
        return;
      }

      queueMicrotask(async () => {
        try {
          await refreshProfile(nextSession.user);
        } catch (profileError) {
          if (active) {
            setError(profileError.message ?? "Could not refresh your profile.");
          }
        }
      });
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

  const signInWithPassword = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error("Supabase is not configured.");

    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  const signUpWithPassword = useCallback(async ({ email, password, displayName }) => {
    if (!supabase) throw new Error("Supabase is not configured.");

    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || null,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      throw signUpError;
    }

    return data;
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
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };
}
