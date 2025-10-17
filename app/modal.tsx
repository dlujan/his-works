import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { useWorks } from "@/context/works-context";

export default function CreateWorkModal() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { createWork } = useWorks();

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0;

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Title is required.");
      return;
    }

    const trimmedDetails = details.trim();
    const summary =
      trimmedDetails.length > 0
        ? trimmedDetails.length > 120
          ? `${trimmedDetails.slice(0, 117)}...`
          : trimmedDetails
        : "No summary yet.";

    createWork({
      title: trimmedTitle,
      details: trimmedDetails,
      summary,
    });

    router.back();
  }, [createWork, details, router, title]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Create new work
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Capture a testimony or project you want to track.
        </Text>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <TextInput
            label="Title"
            mode="outlined"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError && text.trim().length > 0) {
                setTitleError(null);
              }
            }}
            style={styles.input}
            error={Boolean(titleError)}
          />
          <HelperText type="error" visible={Boolean(titleError)}>
            {titleError ?? ""}
          </HelperText>

          <TextInput
            label="Details"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.multiline]}
          />
        </ScrollView>

        <View style={styles.actions}>
          <Button onPress={() => router.back()}>Cancel</Button>
          <Button mode="contained" onPress={handleSubmit} disabled={!canSubmit}>
            Create work
          </Button>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
  },
  form: {
    paddingTop: 24,
    paddingBottom: 32,
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 150,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingBottom: 24,
  },
});
