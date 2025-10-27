import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { TagMultiSelect } from "@/components/TagMultiSelect";
import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useTags } from "@/hooks/data/useTags";
import { supabase } from "@/lib/supabase";
import { ReminderType } from "@/lib/types";
import { getNextReminderDate } from "@/utils/reminders";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DatePickerInput } from "react-native-paper-dates";

export default function CreateWorkModal() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const authUser = session?.user ?? null;
  const { user } = useAuth();
  const { tags: availableTags } = useTags();

  const [details, setDetails] = useState("");
  const [bibleVerse, setBibleVerse] = useState("");
  const [date, setDate] = useState(new Date());
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedDetails = details.trim();
    if (!trimmedDetails || !authUser) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1️⃣ Create the testimony
      const { data: testimony, error: createError } = await supabase
        .from("testimony")
        .insert({
          user_uuid: authUser.id,
          text: trimmedDetails,
          bible_verse: bibleVerse.trim() || null,
          date: date,
          is_public: isPrivate ? false : isPublic,
          is_private: isPrivate,
        })
        .select("uuid")
        .single();

      if (createError) throw createError;

      const testimonyId = testimony.uuid;

      // 2️⃣ Insert selected tags into join table
      for (const tagName of tags) {
        const { data: existingTag, error: tagError } = await supabase
          .from("tag")
          .select("uuid")
          .eq("name", tagName)
          .single();

        if (tagError) throw tagError;

        const tagUuid = existingTag.uuid;

        const { error: linkError } = await supabase
          .from("testimony_tag")
          .insert({ testimony_uuid: testimonyId, tag_uuid: tagUuid });

        if (linkError) throw linkError;
      }

      // 3️⃣ Create default reminders
      const reminders = [];
      const now = dayjs();
      const testimonyDate = date ? dayjs(date) : now;

      if (user?.reminder_settings?.yearly) {
        reminders.push({
          user_uuid: authUser.id,
          testimony_uuid: testimony.uuid,
          scheduled_for: getNextReminderDate(testimonyDate, "year"),
          type: ReminderType.YEARLY,
        });
      }

      if (user?.reminder_settings?.quarterly) {
        reminders.push({
          user_uuid: authUser.id,
          testimony_uuid: testimony.uuid,
          scheduled_for: getNextReminderDate(testimonyDate, "quarter"),
          type: ReminderType.QUARTERLY,
        });
      }
      const { error: reminderError } = await supabase
        .from("reminder")
        .insert(reminders);

      if (reminderError) {
        console.error("Failed to create reminders:", reminderError);
      }

      queryClient.invalidateQueries({ queryKey: ["user-testimonies"] });
      router.back();
    } catch (error: any) {
      console.error("Error creating testimony:", error);
      setMessage(error.message || "Failed to save testimony.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Surface
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Capture a work that God has done in your life.
          </Text>

          <TextInput
            label="Your testimony"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.multiline]}
          />

          <TextInput
            label="Bible Verse"
            mode="outlined"
            value={bibleVerse}
            onChangeText={setBibleVerse}
            placeholder="e.g. Psalms 23:1"
            style={styles.input}
          />

          <DatePickerInput
            locale="en"
            label="Date"
            placeholder="Date of event"
            value={date}
            onChange={(d) => d && setDate(d)}
            inputMode="start"
            mode="outlined"
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
          </View>

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
                  Share with everyone, not just your friends.
                </Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
          )}

          {message && (
            <Text
              variant="bodySmall"
              style={[
                styles.message,
                {
                  color: message.includes("success")
                    ? "green"
                    : theme.colors.error,
                },
              ]}
            >
              {message}
            </Text>
          )}
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!details || loading}
              loading={loading}
            >
              Create Testimony
            </Button>
          </View>
        </ScrollView>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  form: {
    paddingTop: 16,
    paddingBottom: 48,
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 150,
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
});
