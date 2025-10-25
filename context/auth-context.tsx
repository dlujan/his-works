import type { Session } from "@supabase/supabase-js";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import registerForPushNotificationsAsync from "@/utils/registerForPushNotificationsAsync";

type SignInArgs = {
  email: string;
  password: string;
};

type SignUpArgs = {
  email: string;
  password: string;
};

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signInWithPassword: (args: SignInArgs) => Promise<void>;
  signUpWithEmail: (args: SignUpArgs) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          console.warn("Failed to load session", error);
        }

        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;

        console.warn("Unexpected session error", error);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signInWithPassword: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      },
      signUpWithEmail: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        const user = data.user;
        if (!user) return;

        // ✅ Request permission + get token
        const expoPushToken = await registerForPushNotificationsAsync();

        if (expoPushToken) {
          // ✅ Save token in your `user` table
          const { error: updateError } = await supabase
            .from("user")
            .update({ expo_push_token: expoPushToken })
            .eq("id", user.id);

          if (updateError)
            console.log("Failed to save push token:", updateError);
        }

        // Sign in
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email,
              password,
            }
          );

          if (signInError) {
            throw signInError;
          }
        }
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [loading, session]
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
