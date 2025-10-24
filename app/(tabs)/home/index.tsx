import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, Share, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Card,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { formatTimeSince } from "@/utils/time";

type Testimony = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  createdAt: string;
  likes: number;
};

const now = Date.now();

const testimonies: Testimony[] = [
  {
    id: "t1",
    title: "Breakthrough in the city",
    author: "Elena Martinez",
    excerpt:
      "Our team has been praying for open doors downtown. Yesterday we were invited into a neighborhood we'd never served before.",
    createdAt: new Date(now - 1000 * 60 * 25).toISOString(), // 25 minutes ago
    likes: 24,
  },
  {
    id: "t2",
    title: "Provision for the pantry",
    author: "Marcus Lee",
    excerpt:
      "We were short on fresh produce, but a farmer called to donate crates of fruit right before opening.",
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    likes: 18,
  },
  {
    id: "t3",
    title: "Youth night transformation",
    author: "Sarah Johnson",
    excerpt:
      "Students shared testimonies of freedom, and three new families asked how they could get involved.",
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    likes: 32,
  },
  {
    id: "t4",
    title: "Answered prayer for healing",
    author: "David Kim",
    excerpt:
      "After weeks of praying, my neighbor finally received the medical results we had been hoping for.",
    createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    likes: 45,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  const handleShare = useCallback(async (item: Testimony) => {
    try {
      await Share.share({
        title: item.title,
        message: `${item.title} — ${item.excerpt}`,
      });
    } catch (error) {
      console.warn("Unable to share testimony", error);
    }
  }, []);

  // const handleOpen = useCallback(
  //   (item: Testimony) => {
  //     router.push({
  //       pathname: "/(tabs)/home/[id]",
  //       params: { id: item.id },
  //     });
  //   },
  //   [router]
  // );

  const renderItem = useCallback(
    ({ item }: { item: Testimony }) => (
      <Card
        mode="elevated"
        style={styles.card}
        // onPress={() => handleOpen(item)}
        accessible
        accessibilityLabel={`${item.title} by ${item.author}`}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              {item.title}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {formatTimeSince(item.createdAt)}
            </Text>
          </View>
          <Text
            variant="bodyMedium"
            style={[styles.author, { color: theme.colors.inkMuted }]}
          >
            {item.author}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.excerpt, { color: theme.colors.onSurface }]}
            numberOfLines={3}
          >
            {item.excerpt}
          </Text>
        </Card.Content>

        <Card.Actions style={styles.actions}>
          <View style={styles.actionsLeft}>
            <View style={styles.likesChip}>
              <IconButton
                icon="heart-outline"
                size={20}
                iconColor={theme.colors.primary}
                disabled
                accessibilityLabel="Like testimony"
              />
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.primary }}
              >
                {item.likes}
              </Text>
            </View>
          </View>

          <Button
            mode="text"
            icon="share-variant"
            onPress={() => handleShare(item)}
            labelStyle={styles.shareLabel}
          >
            Share
          </Button>
        </Card.Actions>
      </Card>
    ),
    [
      // handleOpen,
      handleShare,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.inkMuted,
      theme.colors.primary,
    ]
  );

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
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
        <Appbar.Content
          title="Community Feed"
          subtitle="Stories that build faith"
        />
      </Appbar.Header>

      <FlatList
        data={testimonies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface }}
            >
              Community testimonies
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Stories of God&apos;s faithfulness to inspire and encourage.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  header: {
    marginBottom: 12,
    gap: 4,
  },
  separator: {
    height: 16,
  },
  card: {
    borderRadius: 20,
  },
  cardContent: {
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: {
    fontWeight: "600",
  },
  excerpt: {
    lineHeight: 20,
  },
  actions: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likesChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  shareLabel: {
    fontWeight: "600",
  },
});
