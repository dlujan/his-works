import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, Chip, IconButton, List, Surface, Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/constants/paper-theme';
import { reminders, type Reminder } from '@/data/reminders';
import { useWorks } from '@/context/works-context';
import { formatTimeUntil } from '@/utils/time';

export default function RemindersScreen() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const { getWorkById } = useWorks();

  const upcomingReminders = useMemo(() => {
    return [...reminders].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
  }, []);

  const handleOpenWork = useCallback(
    (workId: string) => {
      router.push({
        pathname: '/(tabs)/works/[id]',
        params: { id: workId },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Reminder }) => {
      const work = getWorkById(item.workId);
      const dueText = formatTimeUntil(item.dueAt);
      const isOverdue = dueText.includes('overdue');

      return (
        <List.Item
          title={work?.title ?? 'Unknown work'}
          description={item.note}
          titleStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          onPress={() => handleOpenWork(item.workId)}
          style={styles.listItem}
          left={(props) => (
            <List.Icon
              {...props}
              icon="bell-alert-outline"
              color={isOverdue ? theme.colors.error : theme.colors.primary}
            />
          )}
          right={() => (
            <View style={styles.itemMeta}>
              <Chip compact mode="outlined" textStyle={styles.chipText}>
                {dueText}
              </Chip>
              <IconButton
                icon="open-in-new"
                size={20}
                onPress={() => handleOpenWork(item.workId)}
                accessibilityLabel="Open work"
              />
            </View>
          )}
          accessibilityHint="Tap to view or edit the related work"
        />
      );
    },
    [getWorkById, handleOpenWork, theme.colors.error, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.primary]
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
        <Appbar.Content title="Reminders" subtitle="Stay on top of upcoming follow-ups" />
      </Appbar.Header>

      <FlatList
        data={upcomingReminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              No reminders scheduled
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Add reminders to track follow-ups for your works.
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
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
});
