import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const PAGE_SIZE = 10;
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  const fetchTestimonies = useCallback(
    async (reset = false) => {
      if (!user?.uuid || loading) return;

      setLoading(true);
      const from = reset ? 0 : page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("testimony")
        .select("*, user(full_name, avatar_url)")
        .or(`is_public.eq.true,user_uuid.eq.${user?.uuid}`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching testimonies:", error.message);
      } else if (data) {
        setTestimonies((prev) => (reset ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
        if (reset) setPage(1);
        else setPage((p) => p + 1);
      }

      setLoading(false);
    },
    [page, user?.uuid, loading]
  );

  useEffect(() => {
    fetchTestimonies(true);
  }, [user?.uuid]);

  const handleRefresh = () => fetchTestimonies(true);

  const handleLoadMore = () => {
    if (hasMore && !loading) fetchTestimonies();
  };

  const renderItem = useCallback(
    ({ item }: { item: Testimony }) => (
      <Pressable
        onPress={() => router.push(`/home/post/${item.uuid}`)}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <View
          style={[
            styles.postContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />

          <View style={styles.postBody}>
            <View style={styles.headerRow}>
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
                <Text
                  style={[styles.likeCount, { color: theme.colors.primary }]}
                >
                  12
                </Text>
              </View>
              <IconButton
                icon="share-outline"
                size={18}
                onPress={() => handleShare(item)}
                iconColor={theme.colors.onSurfaceVariant}
                style={styles.iconButton}
              />
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [handleShare, theme.colors]
  );

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={testimonies}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
  },
  postContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 13,
    marginLeft: 6,
  },
  excerpt: {
    fontSize: 15,
    lineHeight: 22,
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
