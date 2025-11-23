import type { Session } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { User as AppUser } from "@/lib/types";
import { refreshPushTokenIfPossible } from "@/utils/refreshPushTokenIfPossible";
import { useRouter } from "expo-router";

type SignInArgs = { email: string; password: string };
type SignUpArgs = { email: string; password: string };

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  setUser: (args: AppUser) => void;
  signInWithPassword: (args: SignInArgs) => Promise<void>;
  signUpWithEmail: (args: SignUpArgs) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔹 Load session + user on mount
  useEffect(() => {
    let isMounted = true;

    const loadSessionAndUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(data.session ?? null);

        if (data.session?.user) {
          await fetchUser(data.session.user.id);
        }
      } catch (error) {
        console.warn("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionAndUser();

    // 🔹 Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
      if (authSession?.user) {
        fetchUser(authSession.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && user) {
      refreshToken();
    }
  }, [loading, user]);

  async function refreshToken() {
    const newToken = await refreshPushTokenIfPossible();

    if (!newToken) return;

    if (newToken !== user?.expo_push_token) {
      await supabase
        .from("user")
        .update({ expo_push_token: newToken })
        .eq("uuid", user?.uuid);
    }
  }

  // 🔹 Fetch user from your "user" table
  const fetchUser = async (id: string) => {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("uuid", id) // or .eq("id", id) depending on your schema
      .single();

    if (error) {
      console.warn("Failed to fetch user record:", error);
      setUser(null);
      return;
    }

    setUser(data);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      setUser,
      refreshUser: async () => {
        if (session?.user?.id) await fetchUser(session.user.id);
      },

      signInWithPassword: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) await fetchUser(data.user.id);
        router.replace("/(tabs)");
      },

      signUpWithEmail: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user && !data.session) {
          router.replace("/confirm-notice");
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.replace("/welcome");
      },
    }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
