import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Surface, Text, TextInput, useTheme } from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useUserTestimonies } from "@/hooks/data/useUserTestimonies";

export default function EditWorkScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const { session } = useAuth();
  const user = session?.user ?? null;
  const { testimonies } = useUserTestimonies(user?.id || "");

  const testimony = useMemo(() => {
    if (!id || typeof id !== "string") return undefined;
    return testimonies.find((t) => t.uuid === id);
  }, [testimonies, id]);

  const [title, setTitle] = useState(testimony?.text ?? "");
  const [details, setDetails] = useState(testimony?.text ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (testimony) {
      setTitle(testimony.text);
      setDetails(testimony.text);
    }
  }, [testimony]);

  const handleSave = () => {
    return;
  };

  const handleDelete = () => {
    if (!testimony) {
      return;
    }

    Alert.alert("Delete work", "Are you sure you want to delete this work?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // TODO: Delete work
          router.back();
        },
      },
    ]);
  };

  if (!testimony) {
    return (
      <Surface
        style={[
          styles.fallback,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          We couldn't find that work.
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          It may have been removed or is no longer available.
        </Text>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go back
        </Button>
      </Surface>
    );
  }

  return (
    <Surface
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content} style={{ flex: 1 }}>
        <TextInput
          label="Details"
          mode="outlined"
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={8}
          style={[styles.input, styles.multiline]}
        />

        <View style={styles.actions}>
          <Button mode="contained" onPress={handleSave}>
            Save changes
          </Button>
        </View>

        <Button
          mode="text"
          textColor={theme.colors.error}
          onPress={handleDelete}
          style={styles.deleteButton}
        >
          Delete work
        </Button>
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 200,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: 12,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  backButton: {
    marginTop: 12,
  },
});
