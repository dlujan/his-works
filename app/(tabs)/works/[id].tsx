import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, HelperText, Surface, TextInput, Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/constants/paper-theme';
import { useWorks } from '@/context/works-context';

export default function EditWorkScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const { getWorkById, updateWork, deleteWork } = useWorks();

  const work = useMemo(() => {
    if (!id || typeof id !== 'string') return undefined;
    return getWorkById(id);
  }, [getWorkById, id]);

  const [title, setTitle] = useState(work?.title ?? '');
  const [details, setDetails] = useState(work?.details ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (work) {
      setTitle(work.title);
      setDetails(work.details);
    }
  }, [work]);

  const handleSave = useCallback(() => {
    if (!work) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required.');
      return;
    }

    const trimmedDetails = details.trim();
    const summary =
      trimmedDetails.length > 0
        ? trimmedDetails.length > 120
          ? `${trimmedDetails.slice(0, 117)}...`
          : trimmedDetails
        : work.summary;

    updateWork(work.id, {
      title: trimmedTitle,
      details: trimmedDetails.length > 0 ? trimmedDetails : work.details,
      summary,
    });

    router.back();
  }, [details, router, title, updateWork, work]);

  const handleDelete = useCallback(() => {
    if (!work) {
      return;
    }

    Alert.alert('Delete work', 'Are you sure you want to delete this work?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteWork(work.id);
          router.back();
        },
      },
    ]);
  }, [deleteWork, router, work]);

  if (!work) {
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
          We couldn’t find that work.
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          It may have been removed or is no longer available.
        </Text>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go back
        </Button>
      </Surface>
    );
  }

  return (
    <Surface
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content} style={{ flex: 1 }}>
        <TextInput
          label="Title"
          mode="outlined"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (titleError && text.trim().length > 0) {
              setTitleError(null);
            }
          }}
          style={styles.input}
          error={Boolean(titleError)}
        />
        <HelperText type="error" visible={Boolean(titleError)}>
          {titleError ?? ''}
        </HelperText>
        <TextInput
          label="Details"
          mode="outlined"
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={8}
          style={[styles.input, styles.multiline]}
        />

        <View style={styles.actions}>
          <Button mode="contained" onPress={handleSave}>
            Save changes
          </Button>
        </View>

        <Button
          mode="text"
          textColor={theme.colors.error}
          onPress={handleDelete}
          style={styles.deleteButton}
        >
          Delete work
        </Button>
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  input: {
    backgroundColor: 'transparent',
  },
  multiline: {
    minHeight: 200,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  backButton: {
    marginTop: 12,
  },
});
