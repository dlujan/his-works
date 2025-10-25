import type { Session } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { User as AppUser } from "@/lib/types";
import registerForPushNotificationsAsync from "@/utils/registerForPushNotificationsAsync";

type SignInArgs = { email: string; password: string };
type SignUpArgs = { email: string; password: string };

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
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
      },

      signUpWithEmail: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        const authUser = data.user;
        if (!authUser) return;

        // ✅ Register for push notifications
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          await supabase
            .from("user")
            .update({ expo_push_token: expoPushToken })
            .eq("uuid", authUser.id);
        }

        await fetchUser(authUser.id);
      },

      signOut: async () => {
        await supabase.auth.signOut();
        setUser(null);
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
