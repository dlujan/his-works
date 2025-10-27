import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useUserTestimonies } from "@/hooks/data/useUserTestimonies";
import { Testimony } from "@/lib/types";

export default function TestimoniesScreen() {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  const { testimonies, isFetching } = useUserTestimonies(user?.id || "");

  const handleOpenTestimony = useCallback(
    (id: string) => {
      router.push({
        pathname: "/(tabs)/testimonies/[id]",
        params: { id },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Testimony }) => {
      const dateLabel = new Date(
        item.date || item.created_at
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const tags = item.tags;
      const bibleVerse = item.bible_verse;

      return (
        <Pressable
          onPress={() => handleOpenTestimony(item.uuid)}
          style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
        >
          <Surface
            style={[
              styles.card,
              { backgroundColor: theme.colors.surfaceVariant + "20" },
            ]}
            elevation={1}
          >
            <Text
              style={[
                styles.dateText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {dateLabel}
            </Text>

            <Text style={[styles.text, { color: theme.colors.onSurface }]}>
              {item.text.trim()}
            </Text>

            {/* Bible verse reference */}
            <View style={[styles.verseRow, bibleVerse && { marginBottom: 8 }]}>
              {bibleVerse && (
                <Text
                  style={[styles.verseIcon, { color: theme.colors.primary }]}
                  accessibilityLabel="Bible verse reference"
                >
                  📖
                </Text>
              )}
              <Text
                style={[
                  styles.verseText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {bibleVerse}
              </Text>
            </View>

            {/* Tags row */}
            <View style={styles.tagContainer}>
              {tags &&
                tags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tagPill,
                      { backgroundColor: theme.colors.primary + "20" },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: "500",
                      }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
            </View>
          </Surface>
        </Pressable>
      );
    },
    [handleOpenTestimony, theme.colors]
  );

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header
        mode="center-aligned"
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Appbar.Content title="My Testimonies" />
      </Appbar.Header>

      {isFetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={testimonies}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface }}
              >
                No testimonies yet
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Start by recording what God has done in your life.
              </Text>
            </View>
          }
        />
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  dateText: {
    fontSize: 13,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  timeAgo: {
    fontSize: 12,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verseIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  verseText: {
    fontSize: 13,
    fontStyle: "italic",
  },
});
