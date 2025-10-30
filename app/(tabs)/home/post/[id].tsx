import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useLikeTestimony } from "@/hooks/data/mutations/useLikeTestimony";
import { useTestimony } from "@/hooks/data/useTestimony";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { Image, Share, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
const Post = () => {
  const theme = useTheme<AppTheme>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { testimony, isFetching } = useTestimony(id || "");
  const { user } = useAuth();
  const { mutate: likeTestimony } = useLikeTestimony();

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

  if (!testimony || isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={theme.colors.primary} />
      </View>
    );
  }

  const liked = testimony.liked_by_user ?? false;
  const likesCount = testimony.likes_count ?? 0;

  return (
    <View
      style={[
        styles.postContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.headerRow}>
        <Image
          source={{ uri: testimony.user.avatar_url }}
          style={styles.avatar}
        />
        <Text style={[styles.nameText, { color: theme.colors.onSurface }]}>
          {testimony.user.full_name}
        </Text>
        <Text
          style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
        >
          {formatTimeSince(testimony.created_at)}
        </Text>
      </View>

      <View style={styles.postBody}>
        <Text style={[styles.excerpt, { color: theme.colors.onSurface }]}>
          {testimony.text}
        </Text>

        {/* Bible verse reference */}
        {testimony.bible_verse && (
          <View style={styles.verseRow}>
            <Text
              style={[styles.verseIcon, { color: theme.colors.primary }]}
              accessibilityLabel="Bible verse reference"
            >
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

        {/* Tags row */}
        <View style={styles.tagContainer}>
          {testimony.tags &&
            testimony.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tagPill,
                  { backgroundColor: theme.colors.primary + "20" },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "500",
                  }}
                >
                  {tag}
                </Text>
              </View>
            ))}
        </View>

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
                  userUuid: user?.uuid!,
                  liked: !liked,
                })
              }
            />
            <Text style={[styles.likeCount, { color: theme.colors.primary }]}>
              {likesCount}
            </Text>
          </View>
          <IconButton
            icon="share-outline"
            size={20}
            onPress={() => handleShare(testimony)}
            iconColor={theme.colors.onSurfaceVariant}
            style={styles.iconButton}
          />
        </View>
      </View>
    </View>
  );
};

export default Post;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  postContainer: {
    flexDirection: "column",
    gap: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    includeFontPadding: false,
    textRendering: "geometricPrecision",
    marginLeft: 10,
  },
  postBody: {},
  timestamp: {
    fontSize: 13,
    marginLeft: 6,
    includeFontPadding: false,
    textRendering: "geometricPrecision",
  },
  excerpt: {
    fontSize: 15,
    lineHeight: 22,
    includeFontPadding: false,
    textRendering: "geometricPrecision",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    left: -8,
  },
  iconButton: {
    margin: 0,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: "500",
    includeFontPadding: false,
    textRendering: "geometricPrecision",
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  verseIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  verseText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
