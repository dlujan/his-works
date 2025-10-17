import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAuth } from "@/context/auth-context";

type SignupScreenProps = {
  onSwitchToLogin: () => void;
};

export function SignupScreen({ onSwitchToLogin }: SignupScreenProps) {
  const { signUpWithEmail } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasError = Boolean(error);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail({
        email: email.trim(),
        password,
      });
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "Unable to sign up. Check your details and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.card} mode="elevated">
        <Text variant="headlineMedium" style={styles.title}>
          Create your account
        </Text>

        <TextInput
          label="Email"
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
          disabled={loading}
        />

        <HelperText type="error" visible={hasError} style={styles.helper}>
          {error ?? ""}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!canSubmit}
        >
          Sign Up
        </Button>

        <Button
          mode="text"
          onPress={onSwitchToLogin}
          disabled={loading}
          textColor={theme.colors.primary}
          uppercase={false}
          style={styles.switch}
          labelStyle={styles.switchLabel}
        >
          Already have an account? Log in
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  helper: {
    minHeight: 20,
    marginBottom: 8,
  },
  switch: {
    marginTop: 12,
  },
  switchLabel: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
