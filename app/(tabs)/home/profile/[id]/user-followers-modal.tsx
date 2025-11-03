import { AppTheme } from "@/constants/paper-theme";
import { useUserFollowers } from "@/hooks/data/useUserFollowers";
import { User } from "@/lib/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

export default function MyFollowersModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme<AppTheme>();
  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    isFetchingNextPage: isFetchingNextFollowersPage,
    fetchNextPage: fetchNextFollowersPage,
    hasNextPage: hasNextFollowersPage,
  } = useUserFollowers(id || "");
  const followers = followersData?.pages.flatMap((p) => p.followers) ?? [];
  const followersCount = followersData?.pages?.[0]?.totalCount ?? 0;

  const handleLoadMoreFollowers = () => {
    if (hasNextFollowersPage) fetchNextFollowersPage();
  };

  const renderItem = useCallback(
    ({ item }: { item: Partial<User> }) => {
      return (
        <Pressable
        //   onPress={() => router.push(`/home/post/${item.uuid}`)}
        // style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <View
            style={[
              styles.followerRow,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />

            <View style={styles.followerName}>
              <Text
                style={[styles.nameText, { color: theme.colors.onSurface }]}
              >
                {item.full_name}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [theme.colors, id]
  );
  return (
    <View style={styles.screen}>
      {isLoadingFollowers ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => item.uuid!}
          renderItem={renderItem}
          onEndReached={handleLoadMoreFollowers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextFollowersPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator animating color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoadingFollowers && !isFetchingNextFollowersPage ? (
              <View style={styles.emptyState}>
                <Text
                  variant="titleMedium"
                  style={{
                    color: theme.colors.onSurface,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  No followers yet.
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
  followerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  followerName: {},

  nameText: { fontSize: 15, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
