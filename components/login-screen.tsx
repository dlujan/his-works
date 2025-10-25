import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAuth } from "@/context/auth-context";

type LoginScreenProps = {
  onSwitchToSignup: () => void;
};

export function LoginScreen({ onSwitchToSignup }: LoginScreenProps) {
  const { signInWithPassword } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError(null);
      await signInWithPassword({ email: email.trim(), password });
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "Unable to sign in. Check your credentials and try again.";
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
      <Surface
        elevation={2}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Welcome back
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Continue your rhythm of remembering God's faithfulness.
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
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            disabled={loading}
            style={styles.input}
          />

          <HelperText
            type="error"
            visible={Boolean(error)}
            style={[styles.helper, { color: theme.colors.error }]}
          >
            {error ?? ""}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submitButton}
            contentStyle={{ paddingVertical: 4 }}
          >
            Log In
          </Button>
        </View>

        <Button
          mode="text"
          onPress={onSwitchToSignup}
          disabled={loading}
          textColor={theme.colors.primary}
          style={styles.switch}
          labelStyle={styles.switchLabel}
        >
          Need an account? Sign up
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
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
