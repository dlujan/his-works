import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, IconButton, List, Surface, Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/constants/paper-theme';
import type { Work } from '@/data/works';
import { formatTimeSince } from '@/utils/time';
import { useWorks } from '@/context/works-context';

export default function WorksScreen() {
  const { works } = useWorks();
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  const handleOpenWork = useCallback(
    (id: string) => {
      router.push({
        pathname: '/(tabs)/works/[id]',
        params: { id },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Work }) => (
      <List.Item
        title={item.title}
        description={item.summary}
        titleStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        onPress={() => handleOpenWork(item.id)}
        style={styles.listItem}
        left={(props) => (
          <List.Icon {...props} icon="file-document-outline" color={theme.colors.primary} />
        )}
        right={() => (
          <View style={styles.itemMeta}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatTimeSince(item.updatedAt)}
            </Text>
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => handleOpenWork(item.id)}
              accessibilityLabel="Edit work"
            />
          </View>
        )}
        accessibilityHint="Tap to edit or delete this work"
      />
    ),
    [handleOpenWork, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.primary],
  );

  return (
    <Surface
      style={[
        styles.screen,
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
        <Appbar.Content title="Works" subtitle="Capture and refine your testimonies" />
      </Appbar.Header>

      <FlatList
        data={works}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              No works yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Start by adding your first testimony.
            </Text>
          </View>
        }
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  listItem: {
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  itemMeta: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
});
