import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { AppNotification, AppNotificationType } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { List, Surface, Text, useTheme } from "react-native-paper";

export default function ActivityScreen() {
  const theme = useTheme<AppTheme>();
  const { session } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO: Use react query so this can be invalidated
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notification")
      .select("*")
      .eq("user_uuid", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpenItem = (notification: AppNotification) => {
    const { type, data } = notification;
    if (type === AppNotificationType.REMINDER && data.testimony_uuid) {
      router.push(`/testimony-display-modal/${data.testimony_uuid}`);
    }
  };

  const getIconSlug = (notification: AppNotification) => {
    const { type, read } = notification;
    if (type === AppNotificationType.REMINDER) {
      return read ? "bell-outline" : "bell-badge";
    } else if (type === AppNotificationType.LIKE) {
      return "heart-outline";
    } else if (type === AppNotificationType.COMMENT) {
      return "message-outline";
    } else {
      return "information-outline";
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => handleOpenItem(item)}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
    >
      <List.Item
        title={item.title ?? "Notification"}
        description={item.body ?? ""}
        titleStyle={{ color: theme.colors.onSurface, fontWeight: "600" }}
        descriptionNumberOfLines={3}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        style={[
          styles.listItem,
          !item.read && { backgroundColor: theme.colors.primaryContainer },
        ]}
        left={(props) => (
          <List.Icon
            {...props}
            icon={getIconSlug(item)}
            color={
              !item.read ? theme.colors.primary : theme.colors.onSurfaceVariant
            }
          />
        )}
        right={() => (
          <View style={styles.itemMeta}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {formatTimeSince(item.created_at)}
            </Text>
          </View>
        )}
      />
    </Pressable>
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
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNotifications}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              You&apos;re all caught up
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
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
