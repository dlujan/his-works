import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
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

export default function SignupScreen() {
  const { signUpWithEmail } = useAuth();
  const theme = useTheme<AppTheme>();
  const router = useRouter();

  // const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    // name.trim().length > 0 &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);

      // Check for banned email
      const { data } = await supabase
        .from("banned_email")
        .select("*")
        .eq("email", email.trim())
        .maybeSingle();
      if (data) {
        setError("Sorry, that email has been banned from using this service.");
        return;
      }

      await signUpWithEmail({
        email: email.trim(),
        password,
        // name: name.trim(),
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
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {/* Card Section */}
      <View style={styles.card}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Create your account
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Join the community and make remembering God’s works a habit.
        </Text>

        <View style={styles.form}>
          {/* <TextInput`
            label="Full Name"
            value={name}
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setName}
            mode="outlined"
            maxLength={42}
            disabled={loading}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          /> */}

          <TextInput
            label="Email"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            onChangeText={setEmail}
            mode="outlined"
            disabled={loading}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            disabled={loading}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />

          {error && (
            <HelperText
              type="error"
              visible={Boolean(error)}
              style={[styles.helper, { color: theme.colors.error }]}
            >
              {error}
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
            Sign Up
          </Button>
        </View>

        <Button
          mode="text"
          onPress={() => router.replace("/login")}
          disabled={loading}
          textColor={theme.colors.primary}
          style={styles.switch}
          labelStyle={styles.switchLabel}
        >
          Already have an account? Log in
        </Button>
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
    marginBottom: 16,
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
    alignSelf: "center",
  },
  switchLabel: {
    letterSpacing: 0.2,
  },
});
