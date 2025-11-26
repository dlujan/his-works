import { useState } from "react";
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

import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (!error) {
        setMessage(
          "Check your email for a reset link and open it on this device."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to send link. Check your email and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {/* Card-like Surface */}
      <View style={styles.card}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Forgot password
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Enter your email below and we'll send you a link to reset your
          password.
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
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
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submitButton}
            contentStyle={{ paddingVertical: 4 }}
          >
            Send Link
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
