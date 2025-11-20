import { ActionBottomSheet } from "@/components/ui/ActionBottomSheet";
import { BlockUserModal } from "@/components/ui/BlockUserModal";
import ReportModal from "@/components/ui/ReportModal";
import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useLikeTestimony } from "@/hooks/data/mutations/useLikeTestimony";
import { useReportTestimony } from "@/hooks/data/mutations/useReportTestimony";
import { useProfile } from "@/hooks/data/useProfile";
import {
  UserProfileTestimony,
  useUserTestimonies,
} from "@/hooks/data/useUserTestimonies";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
  Icon,
  IconButton,
  Portal,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

const UserProfileScreen = ({
  shouldUsePortal,
}: {
  shouldUsePortal?: boolean;
}) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme<AppTheme>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigation = useNavigation();
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
  const { mutate: reportTestimony } = useReportTestimony();

  const testimonies = data?.pages.flatMap((p) => p.testimonies) ?? [];

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [selectedTestimony, setSelectedTestimony] =
    useState<UserProfileTestimony>();
  const [reportMenuTestimony, setReportMenuTestimony] =
    useState<UserProfileTestimony>();

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
    checkIfBlocked();
  }, [user, profile]);
  const checkIfBlocked = async () => {
    const { data } = await supabase
      .from("user_block")
      .select("*")
      .eq("blocker_uuid", user?.uuid)
      .eq("blocked_uuid", profile.uuid)
      .maybeSingle();
    if (data) {
      setIsBlocked(true);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: "",
      headerBackTitle: "Back",
      headerRight: () => (
        <View
          style={{
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 4,
          }}
        >
          <IconButton
            icon="dots-horizontal"
            size={26}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => setShowActionsMenu(true)}
            style={{ margin: 0 }}
          />
        </View>
      ),
    });
  }, [navigation, id, theme]);

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

  const handleBlockUser = async (alreadyBlocked: boolean = false) => {
    if (alreadyBlocked) {
      await supabase
        .from("user_block")
        .delete()
        .eq("blocked_uuid", profile.uuid)
        .eq("blocker_uuid", user?.uuid);
      Alert.alert(`${profile.full_name} is unblocked`);
    } else {
      await supabase.from("user_block").insert({
        blocker_uuid: user?.uuid,
        blocked_uuid: profile.uuid,
      });
      Alert.alert(`${profile.full_name} is blocked`);
      queryClient.invalidateQueries({ queryKey: ["home-feed", user?.uuid] });
    }
    queryClient.invalidateQueries({
      queryKey: ["my-blocked-accounts", user?.uuid],
    });
    await checkIfBlocked();
  };

  const handleReportUser = async (reason: string) => {
    // Check if report exists for this profile and user reporting it
    const { data: existingReport } = await supabase
      .from("report")
      .select("*")
      .eq("reporter_uuid", user?.uuid)
      .eq("entity_type", "user")
      .eq("entity_uuid", profile.uuid)
      .eq("reason", reason)
      .maybeSingle();

    if (existingReport) {
      Alert.alert(
        "Report Already Submitted",
        "You have already issued a report for this profile. It is currently under review."
      );
    } else {
      await supabase.from("report").insert({
        reporter_uuid: user?.uuid,
        entity_type: "user",
        entity_uuid: profile.uuid,
        reason: reason,
      });
      Alert.alert(
        "Report Submitted",
        "Thank you for submitting this report. We will review it and take any necessary action."
      );
    }
  };

  const handleReportTestimony = async (reason: string) => {
    if (!user?.uuid || !reportMenuTestimony?.uuid) return;
    reportTestimony({
      reporter_uuid: user.uuid,
      entity_uuid: reportMenuTestimony.uuid,
      reason,
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: UserProfileTestimony }) => {
      const liked = item.liked_by_user ?? false;
      const likesCount = item.likes_count ?? 0;
      const commentsCount = item.comments_count ?? 0;
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
                <View style={styles.headerRowProfile}>
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
                <TouchableOpacity
                  style={{ marginRight: 10 }}
                  onPress={() => setSelectedTestimony(item)}
                >
                  <Icon
                    source="dots-horizontal"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
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
                  <IconButton
                    icon={"comment-outline"}
                    size={20}
                    iconColor={theme.colors.primary}
                    style={styles.iconButton}
                  />
                  <Text
                    style={[styles.likeCount, { color: theme.colors.primary }]}
                  >
                    {commentsCount}
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

  const Wrapper = shouldUsePortal ? Portal.Host : React.Fragment;

  return (
    <Wrapper>
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

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/home/profile/${profile.uuid}/user-followers-modal`
                  )
                }
              >
                <Text
                  style={[
                    styles.followerText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {followerCount}{" "}
                  {followerCount === 1 ? "follower" : "followers"}
                </Text>
              </TouchableOpacity>

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
                    No activity
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      textAlign: "center",
                      marginBottom: 16,
                    }}
                  >
                    Come back later
                  </Text>
                </View>
              ) : null
            }
          />
        )}
        <ActionBottomSheet
          visible={showActionsMenu}
          onDismiss={() => setShowActionsMenu(false)}
          actions={[
            {
              label: isBlocked ? "Unblock" : "Block",
              icon: "block-helper",
              color: "red",
              onPress: () => {
                setShowActionsMenu(false);
                setShowBlockMenu(true);
              },
            },
            {
              label: "Report",
              icon: "flag-outline",
              color: "red",
              onPress: () => {
                setShowActionsMenu(false);
                setShowReportMenu(true);
              },
            },
          ]}
        />
        <BlockUserModal
          visible={showBlockMenu}
          isBlocked={isBlocked}
          onDismiss={() => setShowBlockMenu(false)}
          profile={profile}
          onBlock={(isBlocked) => handleBlockUser(isBlocked)}
        />

        <ReportModal
          visible={showReportMenu}
          title="Report Profile"
          onDismiss={() => setShowReportMenu(false)}
          onReport={(reason) => handleReportUser(reason)}
        />

        <ActionBottomSheet
          visible={!!selectedTestimony}
          onDismiss={() => setSelectedTestimony(undefined)}
          actions={[
            // 🟢 If the testimony belongs to the current user
            ...(selectedTestimony?.user_uuid === user?.uuid
              ? [
                  {
                    label: "Edit",
                    icon: "pencil-outline",
                    onPress: () =>
                      router.push(`/testimonies/${selectedTestimony?.uuid}`),
                  },
                ]
              : []),

            // 🔵 If the comment does NOT belong to the current user
            ...(selectedTestimony?.user_uuid &&
            selectedTestimony.user_uuid !== user?.uuid
              ? [
                  {
                    label: "Report",
                    icon: "flag-outline",
                    color: "red",
                    onPress: () => {
                      setReportMenuTestimony(selectedTestimony);
                    },
                  },
                ]
              : []),

            // ⚪ Always include (everyone sees this)
            // {
            //   label: "Copy link",
            //   icon: "link-variant",
            //   onPress: () => console.log("Copy link pressed"),
            // },
          ]}
        />
        <ReportModal
          visible={!!reportMenuTestimony}
          title="Report Testimony"
          onDismiss={() => setReportMenuTestimony(undefined)}
          onReport={(reason) => handleReportTestimony(reason)}
        />
      </Surface>
    </Wrapper>
  );
};

export default UserProfileScreen;

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerRowProfile: {
    flexDirection: "row",
    alignItems: "center",
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
  listContent: { paddingVertical: 16 },
  separator: { height: 16 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
});
