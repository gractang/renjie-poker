import { useCallback, useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { ensureProfileForUser } from "../lib/accountData";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

WebBrowser.maybeCompleteAuthSession();

export default function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const refreshProfile = useCallback(async (nextUser) => {
    if (!supabase || !nextUser) {
      setProfile(null);
      return null;
    }
    const result = await ensureProfileForUser(nextUser);
    if (result.isNew) setIsNewUser(true);
    setProfile(result.profile);
    return result.profile;
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
      if (sessionError) setError(sessionError.message);

      setSession(data.session);

      if (data.session?.user) {
        try {
          await refreshProfile(data.session.user);
        } catch (profileError) {
          if (active) setError(profileError.message ?? "Could not load your profile.");
        }
      }

      if (active) setLoading(false);
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (!nextSession?.user) {
        setProfile(null);
      } else {
        queueMicrotask(async () => {
          try {
            await refreshProfile(nextSession.user);
          } catch (profileError) {
            if (active) setError(profileError.message ?? "Could not refresh your profile.");
          }
        });
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

    const redirectUrl = AuthSession.makeRedirectUri({ scheme: "pickem-poker" });

    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success" && result.url) {
        const params = new URL(result.url);
        const accessToken = params.hash
          ? new URLSearchParams(params.hash.substring(1)).get("access_token")
          : params.searchParams.get("access_token");
        const refreshToken = params.hash
          ? new URLSearchParams(params.hash.substring(1)).get("refresh_token")
          : params.searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
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

  const dismissNewUser = useCallback(() => setIsNewUser(false), []);

  return {
    hasSupabaseConfig,
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    isNewUser,
    dismissNewUser,
    refreshProfile,
    signInWithGoogle,
    signOut,
  };
}
