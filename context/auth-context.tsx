import type { Session, User } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { User as AppUser } from "@/lib/types";
import { refreshPushTokenIfPossible } from "@/utils/refreshPushTokenIfPossible";
import { SplashScreen, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

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

export function AuthProvider({
  children,
  fontsLoaded,
}: PropsWithChildren<{ fontsLoaded: boolean }>) {
  const posthog = usePostHog();

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
          posthogIdentify(data.session.user);
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

  useEffect(() => {
    if (!loading && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading, fontsLoaded]);

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

  const posthogIdentify = (user: User) => {
    const distinctId = posthog.getDistinctId();
    if (distinctId !== user.id) {
      posthog.identify(user.id, {
        email: user.email || null,
      });
    }
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
        posthog.reset();
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
