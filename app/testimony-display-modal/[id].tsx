import type { AppTheme } from "@/constants/paper-theme";
import { supabase } from "@/lib/supabase";
import { AppNotificationType, Testimony } from "@/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { Divider, Text, useTheme } from "react-native-paper";

export default function TestimonyDisplayModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const [testimony, setTestimony] = useState<Testimony>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimony = async (id: string) => {
      const { data, error } = await supabase
        .from("testimony")
        .select("*")
        .eq("uuid", id)
        .single();

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setTestimony(data);
      }
      setLoading(false);
    };

    if (id) fetchTestimony(id);
  }, [id]);

  // Mark any reminder notifications for this testimony as read
  useEffect(() => {
    const markAsRead = async () => {
      const { error } = await supabase
        .from("notification")
        .update({ read: true })
        .eq("data->>testimony_uuid", id)
        .eq("type", AppNotificationType.REMINDER)
        .eq("read", false);

      if (error) {
        console.log(error.message);
      }

      // TODO: Invalidate notifications query
    };
    if (testimony) {
      markAsRead();
    }
  }, [testimony]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (!testimony) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          Couldn't find this testimony.
        </Text>
      </View>
    );
  }

  const dateLabel = new Date(
    testimony.date || testimony.created_at
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Revisit this moment
        </Text>

        {dateLabel && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {dateLabel}
          </Text>
        )}
      </View>

      <Divider style={{ marginVertical: 12 }} />

      <Text
        variant="bodyLarge"
        style={[styles.body, { color: theme.colors.onSurface }]}
      >
        {testimony.text}
      </Text>

      <Divider style={{ marginVertical: 24 }} />

      {testimony.bible_verse && (
        <Text
          variant="bodyMedium"
          style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
        >
          - {testimony.bible_verse}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 20,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  headerSection: {
    marginBottom: 8,
  },
  title: {
    fontWeight: "600",
    marginBottom: 4,
  },
  body: {
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 16,
  },
  tagChip: {
    borderRadius: 20,
  },
  footerText: {
    alignSelf: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
