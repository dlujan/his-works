import { TagMultiSelect } from "@/components/TagMultiSelect";
import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useTags } from "@/hooks/data/useTags";
import { useTestimony } from "@/hooks/data/useTestimony";
import { supabase } from "@/lib/supabase";
import { ReminderType } from "@/lib/types";
import { getNextReminder, setNextReminderDate } from "@/utils/reminders";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { DatePickerInput } from "react-native-paper-dates";

export default function EditTestimonyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const { session, user } = useAuth();
  const authUser = session?.user ?? null;
  const queryClient = useQueryClient();
  const { tags: availableTags } = useTags();
  const { testimony, isLoading } = useTestimony(id || "");
  const [details, setDetails] = useState(testimony?.text ?? "");
  const [bibleVerse, setBibleVerse] = useState(testimony?.bible_verse ?? "");
  const [date, setDate] = useState(testimony?.date ?? "");
  const [tags, setTags] = useState<string[]>(testimony?.tags ?? []);
  const [isPublic, setIsPublic] = useState(testimony?.is_public);
  const [isPrivate, setIsPrivate] = useState(testimony?.is_private);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (testimony) {
      setDetails(testimony.text);
      setBibleVerse(testimony.bible_verse || "");
      setDate(testimony.date);
      setIsPublic(testimony.is_public);
      setIsPrivate(testimony.is_private);
      setTags(testimony.tags ?? []);
    }
  }, [testimony]);

  useEffect(() => {
    if (isPrivate && isPublic) {
      setIsPublic(false);
    }
  }, [isPrivate]);

  // ✅ Save / Update
  const handleSave = async () => {
    if (!id || !authUser) return;
    setLoading(true);
    setMessage(null);

    try {
      // 1️⃣ Update the main testimony record
      const { error: updateError } = await supabase
        .from("testimony")
        .update({
          text: details.trim(),
          bible_verse: bibleVerse.trim(),
          date: date || testimony?.created_at,
          is_public: isPublic,
          is_private: isPrivate,
        })
        .eq("uuid", id)
        .eq("user_uuid", authUser.id);

      if (updateError) throw updateError;

      // 2️⃣ Clear existing tag relationships
      const { error: deleteTagsError } = await supabase
        .from("testimony_tag")
        .delete()
        .eq("testimony_uuid", id);

      if (deleteTagsError) throw deleteTagsError;

      // 3️⃣ Re-insert selected tags (linking to global `tag` table)
      for (const tagName of tags) {
        // Find or create the tag
        const { data: existingTag, error: tagFetchError } = await supabase
          .from("tag")
          .select("uuid")
          .eq("name", tagName)
          .single();

        if (tagFetchError) throw tagFetchError;

        let tagId = existingTag?.uuid;

        // Insert into join table
        const { error: linkError } = await supabase
          .from("testimony_tag")
          .insert({ testimony_uuid: id, tag_uuid: tagId });

        if (linkError) throw linkError;
      }

      // 🕒 4️⃣ Check if the testimony date changed — if so, reschedule reminders
      let dateChanged = false;
      if (date && date !== testimony?.date) {
        dateChanged = true;
        // Delete all *unsent* reminders for this testimony
        const { error: deleteReminderError } = await supabase
          .from("reminder")
          .delete()
          .eq("testimony_uuid", id)
          .is("sent_at", null);

        if (deleteReminderError) throw deleteReminderError;

        // Recalculate new reminders using the same logic you use at creation
        const newReminders = [];
        const testimonyDate = date ? dayjs(date) : dayjs();

        if (user?.reminder_settings?.yearly) {
          newReminders.push({
            user_uuid: user.uuid,
            testimony_uuid: id,
            scheduled_for: setNextReminderDate(testimonyDate, "year"),
            type: ReminderType.YEARLY,
          });
        }

        if (user?.reminder_settings?.quarterly) {
          newReminders.push({
            user_uuid: user.uuid,
            testimony_uuid: id,
            scheduled_for: setNextReminderDate(testimonyDate, "quarter"),
            type: ReminderType.QUARTERLY,
          });
        }

        if (newReminders.length > 0) {
          const { error: insertError } = await supabase
            .from("reminder")
            .insert(newReminders);
          if (insertError) throw insertError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["testimony", id] });
      queryClient.invalidateQueries({
        queryKey: ["my-testimonies", user!.uuid],
      });
      if (dateChanged) {
        setMessage(
          "Success! Your testimony has been updated and your reminders have been rescheduled."
        );
      } else {
        setMessage("Success! Your testimony has been updated.");
      }
    } catch (error: any) {
      console.error("Error updating testimony:", error);
      Alert.alert("Error", error.message || "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete
  const handleDelete = async () => {
    if (!id || !authUser) return;

    Alert.alert(
      "Delete testimony",
      "Are you sure you want to delete this testimony?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from("testimony")
                .delete()
                .eq("uuid", id)
                .eq("user_uuid", authUser.id);

              if (error) throw error;
              queryClient.invalidateQueries({ queryKey: ["my-testimonies"] });
              Alert.alert("Deleted", "Your testimony has been removed.");
              router.back();
            } catch (error: any) {
              console.error("Error deleting testimony:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to delete testimony."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!testimony && !isLoading) {
    return (
      <Surface
        style={[styles.fallback, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          We couldn't find that testimony.
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
        >
          It may have been removed or is no longer available.
        </Text>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go back
        </Button>
      </Surface>
    );
  }
  const nextReminderText = testimony?.reminders
    ? getNextReminder(testimony.reminders)
    : null;

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.topRow}
            onPress={() => router.push(`/testimonies/${id}/reminders`)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon
                source="bell-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              {nextReminderText ? (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginLeft: 6,
                  }}
                >
                  Next reminder {nextReminderText}
                </Text>
              ) : (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginLeft: 6,
                    textDecorationLine: "underline",
                  }}
                >
                  Reminder settings
                </Text>
              )}
            </View>
            <Link href={`/testimonies/${id}/post`}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                View Post
              </Text>
            </Link>
          </TouchableOpacity>

          <TextInput
            label="My testimony"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={8}
            style={[styles.input, styles.multiline]}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TextInput
            label="Bible verse"
            mode="outlined"
            value={bibleVerse}
            onChangeText={setBibleVerse}
            placeholder="e.g. Psalms 23:1"
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />

          <DatePickerInput
            locale="en"
            label="Date"
            placeholder="Date of event"
            value={date ? new Date(date) : undefined}
            onChange={(d) => {
              if (d) setDate((d as Date).toISOString());
            }}
            inputMode="start"
            mode="outlined"
            saveLabel="Done"
            withDateFormatInLabel={false}
            validRange={{ startDate: new Date(0), endDate: new Date() }}
          />

          {/* Tag selection */}
          <View style={{ marginBottom: 8 }}>
            <TagMultiSelect
              availableTags={availableTags}
              tags={tags}
              setTags={setTags}
            />

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface }}
                >
                  Make private
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Keep this testimony private — only you can see it.
                </Text>
              </View>
              <Switch value={isPrivate} onValueChange={setIsPrivate} />
            </View>

            {!isPrivate && (
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface }}
                  >
                    Share publicly
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Share with everyone, not just followers.
                  </Text>
                </View>
                <Switch value={isPublic} onValueChange={setIsPublic} />
              </View>
            )}
          </View>

          {message && (
            <Text
              variant="bodySmall"
              style={[
                styles.message,
                {
                  color: message.includes("Success")
                    ? "green"
                    : theme.colors.error,
                },
              ]}
            >
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            >
              Save changes
            </Button>
            <Button
              onPress={() => router.push(`/testimony-display-modal/${id}`)}
            >
              Preview
            </Button>
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={handleDelete}
              disabled={loading}
            >
              Delete testimony
            </Button>
          </View>
        </ScrollView>
      )}
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
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 200,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    borderRadius: 20,
  },
  actions: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  backButton: {
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
});
