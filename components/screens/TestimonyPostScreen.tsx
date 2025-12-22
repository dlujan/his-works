import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useAddComment } from "@/hooks/data/mutations/useAddComment";
import { useDeleteComment } from "@/hooks/data/mutations/useDeleteComment";
import { useLikeComment } from "@/hooks/data/mutations/useLikeComment";
import { useLikeTestimony } from "@/hooks/data/mutations/useLikeTestimony";
import { useReportTestimony } from "@/hooks/data/mutations/useReportTestimony";
import { useTestimony } from "@/hooks/data/useTestimony";
import {
  TestimonyComment,
  useTestimonyComments,
} from "@/hooks/data/useTestimonyComments";
import { supabase } from "@/lib/supabase";
import { filterProfanity } from "@/utils/filterProfanity";
import { formatTimeSince } from "@/utils/time";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Icon,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import ImageCarouselModal from "../testimonies/ImageCarouselModal";
import { ActionBottomSheet } from "../ui/ActionBottomSheet";
import ReportModal from "../ui/ReportModal";

const TestimonyPostScreen = () => {
  const theme = useTheme<AppTheme>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { testimony, isFetching } = useTestimony(id || "");
  const { user } = useAuth();
  const { mutate: likeTestimony } = useLikeTestimony();
  const { mutate: addComment } = useAddComment();
  const { mutate: deleteComment, isPending } = useDeleteComment();
  const { mutate: likeComment } = useLikeComment();

  // 🧠 Comments
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingComments,
  } = useTestimonyComments(id || "");
  const navigation = useNavigation();
  const { mutate: reportTestimony } = useReportTestimony();

  const comments = data?.pages.flatMap((p) => p.comments) ?? [];

  // 🧠 State
  const [newComment, setNewComment] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const [creatingFollow, setCreatingFollow] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTestimonyReportMenu, setShowTestimonyReportMenu] = useState(false);
  const [selectedComment, setSelectedComment] = useState<TestimonyComment>();
  const [reportMenuComment, setReportMenuComment] =
    useState<TestimonyComment>();

  useEffect(() => {
    navigation.setOptions({
      title: "Testimony",
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

  // 🧠 Actions
  const handleShareTestimony = useCallback(async (item: any) => {
    if (Platform.OS) {
      try {
        await Share.share({
          title: "Shared testimony",
          message: `${item.text} — ${item.user.full_name}`,
          url: "https://apps.apple.com/us/app/hisworks/id6754654556",
        });
      } catch (error) {
        console.warn("Unable to share testimony", error);
      }
    } else {
      try {
        await Share.share({
          title: "Shared testimony",
          message: `${item.text} — ${item.user.full_name}`,
        });
      } catch (error) {
        console.warn("Unable to share testimony", error);
      }
    }
  }, []);
  const handleShareComment = useCallback(async (item: TestimonyComment) => {
    if (Platform.OS) {
      try {
        await Share.share({
          title: "Shared comment",
          message: `${item.text} — ${item.user.full_name}`,
          url: "https://apps.apple.com/us/app/hisworks/id6754654556",
        });
      } catch (error) {
        console.warn("Unable to share comment", error);
      }
    } else {
      try {
        await Share.share({
          title: "Shared comment",
          message: `${item.text} — ${item.user.full_name}`,
        });
      } catch (error) {
        console.warn("Unable to share comment", error);
      }
    }
  }, []);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment({
      user_uuid: user!.uuid,
      testimony_uuid: id,
      text: filterProfanity(newComment.trim()),
    });
    setNewComment("");
    Keyboard.dismiss();
  };

  const handleDeleteComment = (commentUuid: string) => {
    Alert.alert(
      "Delete comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteComment({
              comment_uuid: commentUuid,
              viewer_uuid: user!.uuid,
              testimony_uuid: id,
            }),
        },
      ]
    );
  };

  const openProfile = (uuid: string) => {
    if (uuid === user?.uuid) router.push("/account");
    else router.push(`/home/profile/${uuid}`);
  };

  const followUser = async () => {
    if (!user) return;
    setCreatingFollow(true);
    try {
      const { error } = await supabase.from("follow").insert({
        follower_uuid: user.uuid,
        followed_uuid: testimony.user_uuid,
      });
      if (error) console.error("Error following:", error.message);
    } finally {
      queryClient.invalidateQueries({ queryKey: ["testimony", id] });
      queryClient.invalidateQueries({
        queryKey: ["profile", testimony.user_uuid],
      });
      setCreatingFollow(false);
    }
  };

  const handleReportTestimony = async (reason: string) => {
    if (!user?.uuid || !testimony?.uuid) return;
    reportTestimony({
      reporter_uuid: user.uuid,
      entity_uuid: testimony.uuid,
      reason,
    });
  };

  const handleReportComment = async (reason: string) => {
    if (!reportMenuComment) return;

    // Check if report exists for this comment and user reporting it
    const { data: existingReport } = await supabase
      .from("report")
      .select("*")
      .eq("reporter_uuid", user?.uuid)
      .eq("entity_type", "comment")
      .eq("entity_uuid", reportMenuComment.uuid)
      .eq("reason", reason)
      .maybeSingle();

    if (existingReport) {
      Alert.alert(
        "Report Already Submitted",
        "You have already issued a report for this comment. It is currently under review."
      );
    } else {
      await supabase.from("report").insert({
        reporter_uuid: user?.uuid,
        entity_type: "comment",
        entity_uuid: reportMenuComment.uuid,
        reason: reason,
      });
      Alert.alert(
        "Report Submitted",
        "Thank you for submitting this report. We will review it and take any necessary action."
      );
    }
  };

  // 🧠 Renderers
  const renderComment = useCallback(
    ({ item }: { item: TestimonyComment }) => {
      const likesCount = item.likes_count ?? 0;
      const liked = item.liked_by_user ?? false;
      const initials = item.user.full_name
        ? item.user.full_name.charAt(0).toUpperCase()
        : "A";
      return (
        <View
          style={[
            styles.commentContainer,
            {
              borderBottomColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          {item.user.avatar_url ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={42}
              label={initials}
              style={{
                backgroundColor: theme.colors.primaryContainer,
                marginRight: 10,
              }}
              color={theme.colors.onPrimaryContainer}
            />
          )}
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <TouchableOpacity
                style={styles.commentHeaderProfile}
                disabled={item.user_uuid === user?.uuid}
                onPress={() => openProfile(item.user_uuid)}
              >
                <Text
                  style={[styles.nameText, { color: theme.colors.onSurface }]}
                >
                  {item.user.full_name}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {formatTimeSince(item.created_at)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginRight: 10 }}
                onPress={() => setSelectedComment(item)}
              >
                <Icon
                  source="dots-horizontal"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.commentText, { color: theme.colors.onSurface }]}
            >
              {item.text}
            </Text>
            <View style={styles.actionsRow}>
              <View style={[styles.likesRow, { left: -10 }]}>
                <IconButton
                  icon={liked ? "heart" : "heart-outline"}
                  size={20}
                  iconColor={theme.colors.primary}
                  style={styles.iconButton}
                  onPress={() =>
                    likeComment({
                      commentUuid: item.uuid,
                      testimonyUuid: id,
                      viewerUuid: user!.uuid,
                      liked: !item.liked_by_user,
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
                onPress={() => handleShareComment(item)}
                iconColor={theme.colors.onSurfaceVariant}
                style={styles.iconButton}
              />
            </View>
          </View>
        </View>
      );
    },
    [theme.colors]
  );

  // 🧠 Header (the post)
  const renderHeader = () => {
    if (!testimony || isFetching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating color={theme.colors.primary} />
        </View>
      );
    }

    const [postWidth, setPostWidth] = useState(0);
    const [previewImageUri, setPreviewImageUri] = useState<
      string | null | undefined
    >(null);

    const liked = testimony.liked_by_user ?? false;
    const likesCount = testimony.likes_count ?? 0;
    const commentsCount = testimony.comments_count ?? 0;
    const following = testimony.followed_by_user ?? false;
    const showFollowBtn = !following && testimony.user_uuid !== user?.uuid;
    const initials = testimony.user.full_name
      ? testimony.user.full_name.charAt(0).toUpperCase()
      : "A";

    return (
      <View
        style={[
          styles.postContainer,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
        onLayout={(e) => setPostWidth(e.nativeEvent.layout.width)}
      >
        <TouchableOpacity
          style={styles.headerRow}
          onPress={() => openProfile(testimony.user_uuid)}
        >
          <View style={styles.headerInfo}>
            {testimony.user.avatar_url ? (
              <Image
                source={{ uri: testimony.user.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={42}
                label={initials}
                style={{
                  backgroundColor: theme.colors.primaryContainer,
                  marginRight: 10,
                }}
                color={theme.colors.onPrimaryContainer}
              />
            )}
            <Text style={[styles.nameText, { color: theme.colors.onSurface }]}>
              {testimony.user.full_name}
            </Text>
            <Text
              style={[
                styles.timestamp,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {formatTimeSince(testimony.created_at)}
            </Text>
          </View>
          {showFollowBtn && (
            <Button
              mode="text"
              compact
              style={{ borderRadius: 12 }}
              labelStyle={{ fontSize: 13 }}
              onPress={followUser}
              loading={creatingFollow}
              disabled={creatingFollow}
            >
              Follow
            </Button>
          )}
          {user?.uuid === testimony.user_uuid && testimony.is_private && (
            <Icon
              source="lock"
              size={12}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </TouchableOpacity>

        <Text style={[styles.text, { color: theme.colors.onSurface }]}>
          {testimony.text}
        </Text>

        {/* Images Carousel */}
        {testimony.images && testimony.images.length > 0 && postWidth > 0 && (
          <View
            style={[styles.images, { width: postWidth }]}
            pointerEvents="box-none"
          >
            <ScrollView
              horizontal
              pagingEnabled={false} // important! pagingEnabled hides the next image
              decelerationRate="normal"
              showsHorizontalScrollIndicator={false}
              style={{ width: postWidth }}
              contentContainerStyle={{ paddingRight: 40 }}
            >
              {testimony.images.map((img) => (
                <TouchableOpacity
                  key={img.uuid}
                  style={{
                    width: postWidth - 120,
                    height: postWidth - 120,
                    marginRight: 10,
                  }}
                  onPress={() => setPreviewImageUri(img.image_path)}
                >
                  <Image
                    source={{ uri: img.image_path }}
                    resizeMode="cover"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 24,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {testimony.bible_verse && (
          <View style={styles.verseRow}>
            <Text style={[styles.verseIcon, { color: theme.colors.primary }]}>
              —
            </Text>
            <Text
              style={[
                styles.verseText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {testimony.bible_verse}
            </Text>
          </View>
        )}

        {/* Tags */}
        {testimony.tags && testimony.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {testimony.tags?.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tagPill,
                  { backgroundColor: theme.colors.primary + "20" },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.primary, fontWeight: "500" }}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.likesRow}>
            <IconButton
              icon={liked ? "heart" : "heart-outline"}
              size={20}
              iconColor={theme.colors.primary}
              style={styles.iconButton}
              onPress={() =>
                likeTestimony({
                  testimonyUuid: testimony.uuid,
                  viewerUuid: user?.uuid!,
                  liked: !liked,
                })
              }
            />
            <Text style={[styles.likeCount, { color: theme.colors.primary }]}>
              {likesCount}
            </Text>
            <IconButton
              icon={"comment-outline"}
              size={20}
              iconColor={theme.colors.primary}
              style={styles.iconButton}
            />
            <Text style={[styles.likeCount, { color: theme.colors.primary }]}>
              {commentsCount}
            </Text>
          </View>
          <IconButton
            icon="share-outline"
            size={20}
            onPress={() => handleShareTestimony(testimony)}
            iconColor={theme.colors.onSurfaceVariant}
            style={styles.iconButton}
          />
        </View>
        <ImageCarouselModal
          visible={!!previewImageUri}
          // @ts-ignore
          images={testimony.images?.map((img) => ({
            localUri: img.image_path,
          }))}
          previewImageUri={previewImageUri}
          onSetImage={setPreviewImageUri}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.uuid}
          renderItem={renderComment}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 80 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            !isLoadingComments && comments.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 40,
                }}
              >
                No comments yet.
              </Text>
            ) : null
          }
        />

        <View
          style={[
            styles.addComment,
            {
              borderTopColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <TextInput
            mode="outlined"
            placeholder="Add comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            dense
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
            style={[
              styles.commentInput,
              { height: Math.min(120, inputHeight) },
            ]}
            outlineStyle={{ borderRadius: 20 }}
            right={
              newComment.length > 0 && (
                <TextInput.Icon
                  icon="arrow-up-circle"
                  onPress={handleAddComment}
                  forceTextInputFocus={false}
                  color={theme.colors.primary}
                />
              )
            }
          />
        </View>

        <ActionBottomSheet
          visible={showActionsMenu}
          onDismiss={() => setShowActionsMenu(false)}
          actions={[
            // 🟢 If the testimony belongs to the current user
            ...(testimony?.user_uuid === user?.uuid
              ? [
                  {
                    label: "Edit",
                    icon: "pencil-outline",
                    onPress: () =>
                      router.push(`/testimonies/${testimony.uuid}`),
                  },
                ]
              : []),

            // 🔵 If the testimony does NOT belong to the current user
            ...(testimony?.user_uuid && testimony.user_uuid !== user?.uuid
              ? [
                  {
                    label: "Report",
                    icon: "flag-outline",
                    color: "red",
                    onPress: () => {
                      setShowTestimonyReportMenu(true);
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
          visible={showTestimonyReportMenu}
          title="Report Testimony"
          onDismiss={() => setShowTestimonyReportMenu(false)}
          onReport={(reason) => handleReportTestimony(reason)}
        />
        <ActionBottomSheet
          visible={!!selectedComment}
          onDismiss={() => setSelectedComment(undefined)}
          actions={[
            // 🟢 If the comment belongs to the current user
            ...(selectedComment?.user_uuid === user?.uuid
              ? [
                  {
                    label: "Delete",
                    icon: "delete-outline",
                    color: "red",
                    onPress: () =>
                      selectedComment &&
                      handleDeleteComment(selectedComment.uuid),
                  },
                ]
              : []),

            // 🔵 If the comment does NOT belong to the current user
            ...(selectedComment?.user_uuid &&
            selectedComment.user_uuid !== user?.uuid
              ? [
                  {
                    label: "Report",
                    icon: "flag-outline",
                    color: "red",
                    onPress: () => {
                      setReportMenuComment(selectedComment);
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
          visible={!!reportMenuComment}
          title="Report Comment"
          onDismiss={() => setReportMenuComment(undefined)}
          onReport={(reason) => handleReportComment(reason)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default TestimonyPostScreen;

// ===================
// 💅 Styles
// ===================
const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  postContainer: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  nameText: { fontSize: 15, fontWeight: "600" },
  timestamp: { fontSize: 13, marginLeft: 6 },
  text: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  images: {
    marginBottom: 10,
  },
  verseRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  verseIcon: { marginRight: 6, fontSize: 14 },
  verseText: { fontSize: 13, fontStyle: "italic" },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likesRow: { flexDirection: "row", alignItems: "center" },
  iconButton: { margin: 0 },
  likeCount: { fontSize: 13, fontWeight: "500" },
  commentContainer: {
    flexDirection: "row",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentBody: {
    flex: 1,
    position: "relative",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentHeaderProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentText: { fontSize: 15, lineHeight: 21 },
  addComment: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  commentInput: { flex: 1, backgroundColor: "transparent" },
});
