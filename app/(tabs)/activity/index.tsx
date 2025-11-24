import NotificationRow from "@/components/notifications/NotificationRow";
import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useMyNotifications } from "@/hooks/data/useMyNotifications";
import { supabase } from "@/lib/supabase";
import { AppNotification, AppNotificationType } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { ActivityIndicator, Surface, Text, useTheme } from "react-native-paper";

export default function ActivityScreen() {
  const theme = useTheme<AppTheme>();
  const { session, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const handleOpenItem = async (notification: AppNotification) => {
    const { type, data } = notification;
    if (type === AppNotificationType.REMINDER && data.testimony_uuid) {
      router.push(`/testimony-display-modal/${data.testimony_uuid}`);
      await markerNotificationAsRead(notification);
    }
  };

  const handleDelete = async (notification: AppNotification) => {
    const { error } = await supabase
      .from("notification")
      .delete()
      .eq("uuid", notification.uuid);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications", user?.uuid] });
  };

  const markerNotificationAsRead = async (notification: AppNotification) => {
    if (notification.read) return;

    const { error } = await supabase
      .from("notification")
      .update({ read: true })
      .eq("uuid", notification.uuid);

    if (error) {
      console.log(error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications", user?.uuid] });
  };

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationRow
        item={item}
        onOpen={handleOpenItem}
        onDelete={handleDelete}
      />
    ),
    [handleOpenItem, theme]
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
