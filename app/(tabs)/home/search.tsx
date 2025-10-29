import type { AppTheme } from "@/constants/paper-theme";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function SearchScreen() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Testimony[]>([]);
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSearch = useCallback(
    async (reset = true) => {
      if (!query.trim()) return;
      if (searching && !reset) return; // prevent overlap

      if (reset) {
        setSearching(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const from = reset ? 0 : page * PAGE_SIZE;
      const { data, error } = await supabase.rpc("search_testimonies", {
        q: query.trim(),
        limit_count: PAGE_SIZE,
        offset_count: from,
      });

      if (error) {
        console.error("Search error:", error.message);
        if (reset) setResults([]);
        setHasMore(false);
      } else {
        const mapped = (data ?? []).map((item: any) => ({
          ...item,
          user: {
            full_name: item.user_full_name,
            avatar_url: item.user_avatar_url,
          },
        }));

        setResults((prev) => (reset ? mapped : [...prev, ...mapped]));
        setHasMore(mapped.length === PAGE_SIZE);
        setPage((p) => (reset ? 1 : p + 1));
      }

      setSearching(false);
      setLoadingMore(false);
    },
    [query, page, searching]
  );

  // 🔍 Debounced search when typing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch(true);
    }, 600); // delay in ms (adjust as needed)

    return () => clearTimeout(timeout); // cleanup on re-type
  }, [query]);

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
          </View>
        </View>
      </Pressable>
    ),
    [theme.colors]
  );

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="Search testimonies or people..."
          mode="outlined"
          value={query}
          onChangeText={setQuery}
          right={
            <TextInput.Icon
              icon="magnify"
              onPress={handleSearch}
              forceTextInputFocus={false}
            />
          }
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore && !loadingMore && !searching) {
              handleSearch(false);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator animating color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !searching && query.trim().length > 0 ? (
              <View style={styles.emptyState}>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                  }}
                >
                  No results found.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchBarContainer: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  searchInput: {
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 0,
  },
  postContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
});
