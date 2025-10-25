import type { AppTheme } from "@/constants/paper-theme";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import React, { useCallback } from "react";
import { FlatList, Image, Share, StyleSheet, View } from "react-native";
import {
  Appbar,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

const now = Date.now();

const testimonies: Testimony[] = [
  {
    uuid: "t1",
    user: {
      full_name: "Elena Martinez",
      avatar_url: "https://i.pravatar.cc/100?img=1",
    },
    text: "Our team has been praying for open doors downtown. Yesterday we were invited into a neighborhood we'd never served before.",
    created_at: new Date(now - 1000 * 60 * 25).toISOString(),
    likes: 24,
  },
  {
    uuid: "t2",
    user: {
      full_name: "Marcus Lee",
      avatar_url: "https://i.pravatar.cc/100?img=2",
    },
    text: "We were short on fresh produce, but a farmer called to donate crates of fruit right before opening.",
    created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    likes: 18,
  },
  {
    uuid: "t3",
    user: {
      full_name: "Sarah Johnson",
      avatar_url: "https://i.pravatar.cc/100?img=3",
    },
    text: "Students shared testimonies of freedom, and three new families asked how they could get involved.",
    created_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    likes: 32,
  },
  {
    uuid: "t4",
    user: {
      full_name: "David Kim",
      avatar_url: "https://i.pravatar.cc/100?img=4",
    },
    text: "After weeks of praying, my neighbor finally received the medical results we had been hoping for.",
    created_at: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    likes: 45,
  },
];

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();

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

  const renderItem = useCallback(
    ({ item }: { item: Testimony }) => (
      <View style={styles.postContainer}>
        <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />

        <View style={styles.postBody}>
          <View style={styles.headerRow}>
            <Text style={[styles.nameText, { color: theme.colors.onSurface }]}>
              {item.user.full_name}
            </Text>
            <Text
              style={[
                styles.timestamp,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              • {formatTimeSince(item.created_at)}
            </Text>
          </View>

          <Text style={[styles.excerpt, { color: theme.colors.onSurface }]}>
            {item.text}
          </Text>

          <View style={styles.actionsRow}>
            <View style={styles.likesRow}>
              <IconButton
                icon="heart-outline"
                size={18}
                iconColor={theme.colors.primary}
                style={styles.iconButton}
              />
              <Text style={[styles.likeCount, { color: theme.colors.primary }]}>
                {item.likes}
              </Text>
            </View>
            <IconButton
              icon="share-variant"
              size={18}
              onPress={() => handleShare(item)}
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.iconButton}
            />
          </View>
        </View>
      </View>
    ),
    [handleShare, theme.colors]
  );

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header
        mode="center-aligned"
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Appbar.Content title="Community Feed" />
      </Appbar.Header>

      <FlatList
        data={testimonies}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerBar: {
    elevation: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postContainer: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginTop: 4,
  },
  postBody: {
    flex: 1,
    paddingBottom: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    includeFontPadding: false,
    textRendering: "geometricPrecision",
  },
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
  separator: {
    height: 16,
  },
});
