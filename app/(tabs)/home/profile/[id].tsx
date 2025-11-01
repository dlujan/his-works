import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useLikeTestimony } from "@/hooks/data/mutations/useLikeTestimony";
import { useProfile } from "@/hooks/data/useProfile";
import {
  UserProfileTestimony,
  useUserTestimonies,
} from "@/hooks/data/useUserTestimonies";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
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

const Profile = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme<AppTheme>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { profile, isLoading: isLoadingProfile } = useProfile(id || "");
  const {
    data,
    isLoading: isLoadingTestimonies,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useUserTestimonies(id || "");
  const { mutate: likeTestimony } = useLikeTestimony();
  const testimonies = data?.pages.flatMap((p) => p.testimonies) ?? [];

  const handleShare = useCallback(async (item: Testimony) => {
    try {
      await Share.share({
        title: "Shared testimony",
        message: `${item.user.full_name} — ${item.text}`,
      });
    } catch (error) {
      console.warn("Unable to share testimony", error);
    }
  }, []);

  const handleLoadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id === user!.uuid) {
      router.replace("/account");
    }
  }, [id, user]);

  const isFollowing = profile.followers?.some(
    (f: any) => f.follower?.uuid === user?.uuid
  );
  const followerCount = profile.followers?.length ?? 0;

  const handleFollowToggle = async () => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    if (isFollowing) {
      Alert.alert(
        "Unfollow",
        `Are you sure you want to unfollow ${profile.full_name}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsUpdating(false),
          },
          {
            text: "Unfollow",
            style: "destructive",
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from("follow")
                  .delete()
                  .eq("follower_uuid", user.uuid)
                  .eq("followed_uuid", profile.uuid);

                if (error) console.error("Error unfollowing:", error.message);
              } finally {
                setIsUpdating(false);
                queryClient.invalidateQueries({
                  queryKey: ["profile", id],
                });
              }
            },
          },
        ]
      );
    } else {
      try {
        const { error } = await supabase.from("follow").insert({
          follower_uuid: user.uuid,
          followed_uuid: profile.uuid,
        });

        if (error) {
          console.error("Error following:", error.message);
        }
      } finally {
        setIsUpdating(false);
        queryClient.invalidateQueries({ queryKey: ["profile", id] });
      }
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: UserProfileTestimony }) => {
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
              <View style={styles.headerRow}>
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
              </View>

              <Text style={[styles.excerpt, { color: theme.colors.onSurface }]}>
                {item.text}
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
                        viewerUuid: user!.uuid,
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

  if (!profile || isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.profileContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.profileDetails}>
          <View style={styles.profileTextContainer}>
            <Text
              style={[styles.profileName, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {profile.full_name}
            </Text>

            <Text
              style={[
                styles.followerText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {followerCount} {followerCount === 1 ? "follower" : "followers"}
            </Text>

            <Button
              mode={isFollowing ? "outlined" : "contained"}
              loading={isUpdating}
              onPress={handleFollowToggle}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </View>

          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.profileAvatar}
            resizeMode="cover"
          />
        </View>
      </View>
      {isLoadingTestimonies ? (
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
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
            !isLoadingTestimonies && !isRefetching && !isFetchingNextPage ? (
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
};

export default Profile;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileContainer: {
    flexDirection: "column",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileAvatar: {
    top: -8,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileTextContainer: {
    flex: 1,
    marginRight: 12,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "600",
  },
  followerText: {
    fontSize: 14,
  },
  postContainer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  postBody: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
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
  listContent: { paddingVertical: 16 },
  separator: { height: 16 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
