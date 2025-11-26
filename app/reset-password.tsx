import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { token } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = password.length > 0 && !loading;

  // Log the user in with the token Supabase sent
  useEffect(() => {
    if (token) {
      (async () => {
        // Exchange recovery token for a session
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token as string,
          type: "email",
        });

        if (error) {
          console.error("verifyOtp error", error);
        } else {
          // User is now logged in temporarily
          await refreshUser();
        }
      })();
    }
  }, [token]);

  const handleReset = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (!error) {
      setMessage("Password updated! Logging you in...");
      setTimeout(() => router.replace("/(tabs)"), 1000);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.card}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Reset password
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Enter your new password.
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            mode="outlined"
            disabled={loading}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(null);
            }}
            secureTextEntry
            mode="outlined"
            disabled={loading}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />
          {message && (
            <HelperText
              type="info"
              visible={Boolean(message)}
              style={[styles.helper, { color: theme.colors.primary }]}
            >
              {message ?? ""}
            </HelperText>
          )}
          {error && (
            <HelperText
              type="error"
              visible={Boolean(error)}
              style={[styles.helper, { color: theme.colors.error }]}
            >
              {error ?? ""}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleReset}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submitButton}
            contentStyle={{ paddingVertical: 4 }}
          >
            Log In
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  card: {
    marginTop: 32,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 28,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  helper: {
    minHeight: 20,
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 4,
  },
  switch: {
    marginTop: 24,
    alignSelf: "center",
  },
  switchLabel: {
    letterSpacing: 0.2,
  },
});
