import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  PaperProvider,
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
import { useRandomBackgroundImage } from "@/hooks/useRandomBackgroundImage";
import { supabase } from "@/lib/supabase";
import { ReminderType } from "@/lib/types";
import { filterProfanity } from "@/utils/filterProfanity";
import { setNextReminderDate } from "@/utils/reminders";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DatePickerInput } from "react-native-paper-dates";

export default function CreateTestimonyModal() {
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
  const [yearlyReminder, setYearlyReminder] = useState(
    user?.reminder_settings.yearly
  );
  const [quarterlyReminder, setQuarterlyReminder] = useState(
    user?.reminder_settings.quarterly
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const imageUrl = useRandomBackgroundImage();

  const dateModalTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      surface: theme.colors.background, // modal background
      onSurface: theme.colors.onSurface, // modal text
    },
  };

  const handleSubmit = async () => {
    if (!details || !authUser) return;

    setLoading(true);
    setMessage(null);

    const moderatedText = filterProfanity(details.trim());
    const moderatedBibleVerse = bibleVerse.trim()
      ? filterProfanity(bibleVerse.trim())
      : null;

    try {
      // 1️⃣ Create the testimony
      const { data: testimony, error: createError } = await supabase
        .from("testimony")
        .insert({
          user_uuid: authUser.id,
          text: moderatedText,
          bible_verse: moderatedBibleVerse,
          date: date,
          is_public: isPrivate ? false : isPublic,
          is_private: isPrivate,
          image_url: imageUrl,
        })
        .select("uuid")
        .single();

      if (createError) throw createError;

      const testimonyId = testimony.uuid;

      // 2️⃣ Insert selected tags into join table
      for (const tagName of tags) {
        const { data: existingTag, error: tagError } = await supabase
          .from("tag")
          .select("*")
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

      if (yearlyReminder) {
        reminders.push({
          user_uuid: authUser.id,
          testimony_uuid: testimony.uuid,
          scheduled_for: setNextReminderDate(testimonyDate, "year"),
          type: ReminderType.YEARLY,
        });
      }

      if (quarterlyReminder) {
        reminders.push({
          user_uuid: authUser.id,
          testimony_uuid: testimony.uuid,
          scheduled_for: setNextReminderDate(testimonyDate, "quarter"),
          type: ReminderType.QUARTERLY,
        });
      }
      const { error: reminderError } = await supabase
        .from("reminder")
        .insert(reminders);

      if (reminderError) {
        console.error("Failed to create reminders:", reminderError);
      }

      queryClient.invalidateQueries({ queryKey: ["my-testimonies"] });
      router.back();
    } catch (error: any) {
      console.error("Error creating testimony:", error);
      setMessage(error.message || "Failed to save testimony.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPrivate && isPublic) {
      setIsPublic(false);
    }
  }, [isPrivate]);

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
            placeholder="Your testimony (e.g. healing, new job, answered prayer)"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={6}
            maxLength={1000}
            style={[styles.input, styles.multiline]}
          />

          <TextInput
            label="Bible Verse"
            mode="outlined"
            value={bibleVerse}
            onChangeText={setBibleVerse}
            placeholder="e.g. Psalms 23:1"
            maxLength={44}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />

          <PaperProvider theme={dateModalTheme}>
            <DatePickerInput
              locale="en"
              label="Date"
              placeholder="Date of event"
              value={date}
              onChange={(d) => d && setDate(d)}
              inputMode="start"
              mode="outlined"
              saveLabel="Done"
              withDateFormatInLabel={false}
              validRange={{ startDate: new Date(0), endDate: new Date() }}
            />
          </PaperProvider>

          {/* Tag selection */}
          <View style={{ marginBottom: 8 }}>
            <TagMultiSelect
              useModal={true}
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
                  Share with everyone, not just followers.
                </Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
          )}

          {/* <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface }}
              >
                Yearly Reminder
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Receive an annual reminder for this testimony.
              </Text>
            </View>
            <Switch value={yearlyReminder} onValueChange={setYearlyReminder} />
          </View>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface }}
              >
                3-Month Reminder
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Receive a reminder every 3 months
              </Text>
            </View>
            <Switch
              value={quarterlyReminder}
              onValueChange={setQuarterlyReminder}
            />
          </View> */}

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
    marginTop: 4,
    marginBottom: 8,
  },
  form: {
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
    paddingVertical: 8,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
});
