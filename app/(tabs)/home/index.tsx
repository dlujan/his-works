import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useLikeTestimony } from "@/hooks/data/mutations/useLikeTestimony";
import { HomeFeedTestimony, useHomeFeed } from "@/hooks/data/useHomeFeed";
import { truncate } from "@/utils/strings";
import { formatTimeSince } from "@/utils/time";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useHomeFeed(user?.uuid || "");
  const { mutate: likeTestimony } = useLikeTestimony();

  const testimonies = data?.pages.flatMap((p) => p.testimonies) ?? [];

  const handleShare = useCallback(async (item: HomeFeedTestimony) => {
    try {
      await Share.share({
        title: "Shared testimony",
        message: `${item.user_full_name} — ${item.text}`,
      });
    } catch (error) {
      console.warn("Unable to share testimony", error);
    }
  }, []);

  const handleLoadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  const openProfile = (userID: string) => {
    if (userID === user?.uuid) {
      router.push("/account");
    } else {
      router.push(`/home/profile/${userID}`);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedTestimony }) => {
      const liked = item.liked_by_user ?? false;
      const likesCount = item.likes_count ?? 0;
      return (
        <Pressable
          onPress={() => router.push(`/home/post/${item.uuid}`)}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <View
            style={[
              styles.postContainer,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Image
              source={{ uri: item.user_avatar_url }}
              style={styles.avatar}
            />

            <View style={styles.postBody}>
              <TouchableOpacity
                style={styles.headerRow}
                disabled={item.user_uuid === user!.uuid}
                onPress={() => openProfile(item.user_uuid)}
              >
                <Text
                  style={[styles.nameText, { color: theme.colors.onSurface }]}
                >
                  {item.user_full_name}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {formatTimeSince(item.created_at)}
                </Text>
                {item.recommended && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginLeft: "auto",
                    }}
                  >
                    Recommended
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.excerpt, { color: theme.colors.onSurface }]}>
                {truncate(item.text, 300)}
              </Text>

              <View style={styles.actionsRow}>
                <View style={styles.likesRow}>
                  <IconButton
                    icon={liked ? "heart" : "heart-outline"}
                    size={20}
                    iconColor={theme.colors.primary}
                    style={styles.iconButton}
                    onPress={() =>
                      likeTestimony({
                        testimonyUuid: item.uuid,
                        viewerUuid: user?.uuid!,
                        liked: !liked,
                      })
                    }
                  />
                  <Text
                    style={[styles.likeCount, { color: theme.colors.primary }]}
                  >
                    {likesCount}
                  </Text>
                </View>
                <IconButton
                  icon="share-outline"
                  size={20}
                  onPress={() => handleShare(item)}
                  iconColor={theme.colors.onSurfaceVariant}
                  style={styles.iconButton}
                />
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleShare, likeTestimony, theme.colors, user?.uuid]
  );

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <FlatList
          data={testimonies}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
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
            !isLoading && !isRefetching && !isFetchingNextPage ? (
              <View style={styles.emptyState}>
                <Text
                  variant="titleMedium"
                  style={{
                    color: theme.colors.onSurface,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  Your feed is quiet right now
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  We'll give you recommendations based on your testimonies. In
                  the meantime, check out what others are posting.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => router.push("/home/search")}
                >
                  Browse
                </Button>
              </View>
            ) : null
          }
        />
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  postContainer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  postBody: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  nameText: { fontSize: 15, fontWeight: "600" },
  timestamp: { fontSize: 13, marginLeft: 6 },
  excerpt: { fontSize: 15, lineHeight: 22 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    left: -10,
  },
  iconButton: { margin: 0 },
  likeCount: {
    fontSize: 13,
    fontWeight: "500",
    includeFontPadding: false,
    textRendering: "geometricPrecision",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
