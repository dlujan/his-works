import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useMyFollowed } from "@/hooks/data/useMyFollowed";
import { useMyFollowers } from "@/hooks/data/useMyFollowers";
import { User } from "@/lib/types";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export default function MyFollowersModal() {
  const { user } = useAuth();
  const theme = useTheme<AppTheme>();
  const router = useRouter();

  // -------------------------------------------------------
  // NEW: Mode state ("followers" | "followed")
  // -------------------------------------------------------
  const [mode, setMode] = useState<"followers" | "followed">("followers");

  // -------------------------------------------------------
  // Followers
  // -------------------------------------------------------
  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    isFetchingNextPage: isFetchingNextFollowersPage,
    fetchNextPage: fetchNextFollowersPage,
    hasNextPage: hasNextFollowersPage,
  } = useMyFollowers(user?.uuid || "");
  const followers = followersData?.pages.flatMap((p) => p.followers) ?? [];
  const followersCount = followersData?.pages?.[0]?.totalCount ?? 0;

  const handleLoadMoreFollowers = () => {
    if (hasNextFollowersPage) fetchNextFollowersPage();
  };

  // -------------------------------------------------------
  // Followed (people I'm following)
  // -------------------------------------------------------
  const {
    data: followedData,
    isLoading: isLoadingFollowed,
    isFetchingNextPage: isFetchingNextFollowedPage,
    fetchNextPage: fetchNextFollowedPage,
    hasNextPage: hasNextFollowedPage,
  } = useMyFollowed(user?.uuid || "");
  const followed = followedData?.pages.flatMap((p) => p.followed) ?? [];
  const followedCount = followedData?.pages?.[0]?.totalCount ?? 0;

  const handleLoadMoreFollowed = () => {
    if (hasNextFollowedPage) fetchNextFollowedPage();
  };

  // -------------------------------------------------------
  // Render item
  // -------------------------------------------------------
  const renderItem = useCallback(
    ({ item }: { item: Partial<User> }) => {
      return (
        <Pressable
          onPress={() => {
            router.dismiss();
            setTimeout(() => {
              router.push(`/home/profile/${item.uuid}`);
            }, 10);
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
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
    [theme.colors, user?.uuid]
  );

  // -------------------------------------------------------
  // Select which dataset is active
  // -------------------------------------------------------
  const showingFollowers = mode === "followers";
  const data = showingFollowers ? followers : followed;
  const isLoading = showingFollowers ? isLoadingFollowers : isLoadingFollowed;
  const isFetchingNextPage = showingFollowers
    ? isFetchingNextFollowersPage
    : isFetchingNextFollowedPage;
  const handleLoadMore = showingFollowers
    ? handleLoadMoreFollowers
    : handleLoadMoreFollowed;
  const emptyText = showingFollowers
    ? "No followers yet."
    : "You're not following anyone yet.";

  return (
    <View style={styles.screen}>
      {/* -------------------------------------------------------
         Header Buttons
      ------------------------------------------------------- */}
      <View style={styles.headerButtons}>
        <Button
          mode={showingFollowers ? "contained" : "outlined"}
          onPress={() => setMode("followers")}
          style={styles.headerButton}
        >
          Followers ({followersCount})
        </Button>

        <Button
          mode={!showingFollowers ? "contained" : "outlined"}
          onPress={() => setMode("followed")}
          style={styles.headerButton}
        >
          Following ({followedCount})
        </Button>
      </View>

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
          data={data}
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
                  variant="titleMedium"
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

  // ---------- NEW styles ----------
  headerButtons: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    justifyContent: "center",
  },
  headerButton: {
    flex: 1,
  },

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
