import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Appbar, List, Surface, Text, useTheme } from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { formatTimeSince } from "@/utils/time";

type ActivityItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  unread?: boolean;
};

const now = Date.now();

const activityItems: ActivityItem[] = [
  {
    id: "1",
    title: "New testimony shared",
    message: "Laura just posted a story about yesterday's outreach.",
    createdAt: new Date(now - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    unread: true,
  },
  {
    id: "2",
    title: "Prayer answered",
    message: "Community pantry received the supplies it needed.",
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(), // 45 minutes ago
  },
  {
    id: "3",
    title: "Volunteer update",
    message: "Three new people signed up to serve this weekend.",
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: "4",
    title: "Reminder",
    message: "Take a moment to encourage a team member today.",
    createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
  },
];

export default function ActivityScreen() {
  const theme = useTheme<AppTheme>();

  const renderItem = ({ item }: { item: ActivityItem }) => (
    <List.Item
      title={item.title}
      description={item.message}
      titleStyle={{ color: theme.colors.onSurface, fontWeight: "600" }}
      descriptionNumberOfLines={3}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      style={[
        styles.listItem,
        item.unread && { backgroundColor: theme.colors.primaryContainer },
      ]}
      left={(props) => (
        <List.Icon
          {...props}
          icon={item.unread ? "bell-badge" : "bell-outline"}
          color={item.unread ? theme.colors.primary : theme.colors.onSurfaceVariant}
        />
      )}
      right={() => (
        <View style={styles.itemMeta}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatTimeSince(item.createdAt)}
          </Text>
        </View>
      )}
    />
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
        <Appbar.Content title="Activity" subtitle="Latest updates and notifications" />
      </Appbar.Header>

      <FlatList
        data={activityItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              You&apos;re all caught up
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              New activity will show up here as it happens.
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
    alignItems: "flex-end",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
