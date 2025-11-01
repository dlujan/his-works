import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useMyNotifications } from "@/hooks/data/useMyNotifications";
import { AppNotification, AppNotificationType } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  List,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

export default function ActivityScreen() {
  const theme = useTheme<AppTheme>();
  const { session } = useAuth();
  const router = useRouter();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useMyNotifications(session?.user?.id || "");

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];

  const handleLoadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  const handleOpenItem = (notification: AppNotification) => {
    const { type, data } = notification;
    if (type === AppNotificationType.REMINDER && data.testimony_uuid) {
      router.push(`/testimony-display-modal/${data.testimony_uuid}`);
    }
  };

  const getIconSlug = (notification: AppNotification) => {
    const { type, read } = notification;
    if (type === AppNotificationType.REMINDER)
      return read ? "bell-outline" : "bell-badge";
    if (type === AppNotificationType.LIKE) return "heart-outline";
    if (type === AppNotificationType.COMMENT) return "message-outline";
    return "information-outline";
  };

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
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
                !item.read
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
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
    ),
    [theme.colors]
  );

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Loading more…
                </Text>
              </View>
            ) : null
          }
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
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    paddingBottom: 32,
  },
  separator: { height: 12 },
  listItem: { borderRadius: 16, backgroundColor: "transparent" },
  itemMeta: { alignItems: "flex-end", justifyContent: "center" },
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
});
