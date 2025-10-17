import React, { useCallback, useMemo } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Divider, List, Surface, Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/constants/paper-theme';
import { getTestimonyById } from '@/data/testimonies';
import { formatTimeSince } from '@/utils/time';

export default function TestimonyDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme<AppTheme>();

  const testimony = useMemo(() => {
    if (typeof id !== 'string') {
      return undefined;
    }

    return getTestimonyById(id);
  }, [id]);

  const handleShare = useCallback(async () => {
    if (!testimony) return;

    try {
      await Share.share({
        title: testimony.title,
        message: `${testimony.title}\n\n${testimony.body}`,
      });
    } catch (error) {
      console.warn('Unable to share testimony', error);
    }
  }, [testimony]);

  if (!testimony) {
    return (
      <Surface
        style={[
          styles.fallback,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          We couldn’t find that testimony.
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          It may have been removed or is no longer available.
        </Text>
      </Surface>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.contentContainer}
    >
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
            {testimony.title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.inkMuted, fontWeight: '600' }}>
            {testimony.author}
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatTimeSince(testimony.createdAt)}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, lineHeight: 24 }}>
          {testimony.body}
        </Text>

        <View style={styles.metaRow}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {testimony.likes} likes
          </Text>
          <Button
            icon="share-variant"
            mode="text"
            onPress={handleShare}
            labelStyle={styles.shareLabel}
          >
            Share
          </Button>
        </View>
      </Surface>

      <Surface style={[styles.commentsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Comments
        </Text>
        <List.Section>
          {testimony.comments.map((comment, index) => (
            <View key={comment.id}>
              <List.Item
                title={comment.author}
                description={comment.body}
                titleStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                right={() => (
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatTimeSince(comment.createdAt)}
                  </Text>
                )}
              />
              {index < testimony.comments.length - 1 && <Divider />}
            </View>
          ))}
          {testimony.comments.length === 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No comments yet. Be the first to encourage!
            </Text>
          )}
        </List.Section>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  divider: {
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareLabel: {
    fontWeight: '600',
  },
  commentsCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
});
