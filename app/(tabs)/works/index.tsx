import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Appbar, List, Surface, Text, useTheme } from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useUserTestimonies } from "@/hooks/data/useUserTestimonies";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";

export default function WorksScreen() {
  const { session } = useAuth();
  const user = session?.user ?? null;

  const { testimonies, isFetching } = useUserTestimonies(user?.id || "");
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  const handleOpenTestimony = useCallback(
    (id: string) => {
      router.push({
        pathname: "/(tabs)/works/[id]",
        params: { id },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Testimony }) => (
      <List.Item
        title={""}
        description={item.text}
        titleStyle={{ color: theme.colors.onSurface, fontWeight: "600" }}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        onPress={() => handleOpenTestimony(item.uuid)}
        style={styles.listItem}
        right={() => (
          <View style={styles.itemMeta}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {formatTimeSince(item.updated_at)}
            </Text>
          </View>
        )}
        accessibilityHint="Tap to edit or delete this work"
      />
    ),
    [
      handleOpenTestimony,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.primary,
    ]
  );

  return (
    <Surface
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
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
        <Appbar.Content title="Works" />
      </Appbar.Header>

      <FlatList
        data={testimonies}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              No works yet
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Start by adding your first testimony.
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  listItem: {
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  itemMeta: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
