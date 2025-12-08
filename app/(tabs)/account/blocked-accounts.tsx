import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useMyBlockedAccounts } from "@/hooks/data/useMyBlockedAccounts";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { Avatar, Button, Text, useTheme } from "react-native-paper";

export default function BlockedAccounts() {
  const { user } = useAuth();
  const theme = useTheme<AppTheme>();
  const queryClient = useQueryClient();

  // -------------------------------------------------------
  // Followers
  // -------------------------------------------------------
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useMyBlockedAccounts(user?.uuid || "");
  const blocked = data?.pages.flatMap((p) => p.blocked) ?? [];

  const handleLoadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  const handleUnblock = async (profile: Partial<User>) => {
    Alert.alert(
      `Unblock ${profile.full_name}?`,
      "Confirm you want to unblock this user.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "default",
          onPress: async () => {
            try {
              await supabase
                .from("user_block")
                .delete()
                .eq("blocked_uuid", profile.uuid)
                .eq("blocker_uuid", user?.uuid);
            } catch (error: any) {
              console.error("Error unblocking account:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to unblock account."
              );
            } finally {
              queryClient.invalidateQueries({
                queryKey: ["home-feed", user?.uuid],
              });
              queryClient.invalidateQueries({
                queryKey: ["my-blocked-accounts", user?.uuid],
              });
            }
          },
        },
      ]
    );
  };

  // -------------------------------------------------------
  // Render item
  // -------------------------------------------------------
  const renderItem = useCallback(
    ({ item }: { item: Partial<User> }) => {
      const initials = item.full_name
        ? item.full_name.charAt(0).toUpperCase()
        : "A";
      return (
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.avatarName}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <Avatar.Text
                size={42}
                label={initials}
                style={{
                  backgroundColor: theme.colors.primaryContainer,
                }}
                color={theme.colors.onPrimaryContainer}
              />
            )}

            <View>
              <Text
                style={[styles.nameText, { color: theme.colors.onSurface }]}
              >
                {item.full_name}
              </Text>
            </View>
          </View>
          <Button onPress={() => handleUnblock(item)}>Unblock</Button>
        </View>
      );
    },
    [theme.colors, user?.uuid]
  );

  const emptyText = "You haven't blocked anyone.";

  return (
    <View style={styles.screen}>
      {/* -------------------------------------------------------
         List
      ------------------------------------------------------- */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.uuid!}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator animating color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading && !isFetchingNextPage ? (
              <View style={styles.emptyState}>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurface,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {emptyText}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarName: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  nameText: { fontSize: 15, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
