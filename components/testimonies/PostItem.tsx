import type { AppTheme } from "@/constants/paper-theme";
import { HomeFeedTestimony } from "@/hooks/data/useHomeFeed";
import { truncate } from "@/utils/strings";
import { formatTimeSince } from "@/utils/time";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar, Icon, IconButton, Text } from "react-native-paper";
import ImageCarouselModal from "./ImageCarouselModal";

function PostItem({
  item,
  theme,
  onPressMore,
  onPressProfile,
  onPressShare,
  onToggleLike,
  router,
}: {
  item: HomeFeedTestimony;
  theme: AppTheme;
  onPressMore: (item: HomeFeedTestimony) => void;
  onPressProfile: (uuid: string) => void;
  onPressShare: (item: HomeFeedTestimony) => void;
  onToggleLike: (item: HomeFeedTestimony) => void;
  router: any;
}) {
  const [postWidth, setPostWidth] = useState(0);
  const [previewImageUri, setPreviewImageUri] = useState<
    string | null | undefined
  >(null);
  const [modalImages, setModalImages] = useState<
    {
      uuid?: string;
      localUri?: string;
      compressedUri?: string;
      remoteUrl?: string;
      uploading: boolean;
      isNew?: boolean;
      sort_order?: number;
    }[]
  >([]);

  useEffect(() => {
    if (item) {
      setModalImages(
        //@ts-ignore
        item.images
          ?.map((img) => ({
            localUri: img.image_path,
            sort_order: img.sort_order,
          }))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
    }
  }, [item]);

  const openPost = () => {
    router.push(`/home/post/${item.uuid}`);
  };

  const images = item.images ?? [];
  const liked = item.liked_by_user ?? false;
  const likesCount = item.likes_count ?? 0;
  const commentsCount = item.comments_count ?? 0;
  const initials = item.user_full_name
    ? item.user_full_name.charAt(0).toUpperCase()
    : "A";

  return (
    <View
      style={[
        styles.postContainer,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View
        style={styles.postBody}
        onLayout={(e) => setPostWidth(e.nativeEvent.layout.width)}
      >
        {/* Header - 2 column */}
        <View style={styles.headerRow}>
          {/* column 1 */}
          <TouchableOpacity onPress={() => onPressProfile(item.user_uuid)}>
            {/* Avatar */}
            {item.user_avatar_url ? (
              <Image
                source={{ uri: item.user_avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={42}
                label={initials}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                color={theme.colors.onPrimaryContainer}
              />
            )}
          </TouchableOpacity>

          {/* column 2 */}
          <View
            style={{
              flexDirection: "column",
              flex: 1,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View style={{ gap: 4 }}>
                {item.recommended && (
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Recommended
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => onPressProfile(item.user_uuid)}
                  style={{ flexDirection: "row", alignItems: "center" }}
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
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={{ marginRight: 10 }}
                onPress={() => onPressMore(item)}
              >
                <Icon
                  source="dots-horizontal"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={openPost}>
              <Text style={[styles.excerpt, { color: theme.colors.onSurface }]}>
                {truncate(item.text, 300)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Images Carousel */}
        {images.length > 0 && postWidth > 0 && (
          <View
            style={{ width: postWidth, marginTop: 12 }}
            pointerEvents="box-none"
          >
            <ScrollView
              horizontal
              pagingEnabled={false} // important! pagingEnabled hides the next image
              decelerationRate="normal"
              showsHorizontalScrollIndicator={false}
              style={{ width: postWidth }}
              contentContainerStyle={{ paddingLeft: 55 }}
            >
              {images.map((img) => (
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
                      borderRadius: 16,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={styles.avatar}></View>
          <TouchableOpacity
            onPress={openPost}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <View style={styles.actionsRow}>
              <View style={styles.likesRow}>
                <IconButton
                  icon={liked ? "heart" : "heart-outline"}
                  size={20}
                  iconColor={theme.colors.primary}
                  style={styles.iconButton}
                  onPress={() => onToggleLike(item)}
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
            </View>
            <IconButton
              icon="share-outline"
              size={20}
              onPress={() => onPressShare(item)}
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.iconButton}
            />
          </TouchableOpacity>
        </View>
      </View>
      <ImageCarouselModal
        visible={!!previewImageUri}
        images={modalImages}
        previewImageUri={previewImageUri}
        onSetImage={setPreviewImageUri}
      />
    </View>
  );
}

export default PostItem;

const styles = StyleSheet.create({
  postContainer: {
    flexDirection: "column",
    paddingTop: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  postBody: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    gap: 12,
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
});
