import { AppTheme } from "@/constants/paper-theme";
import { supabase } from "@/lib/supabase";
import { Reminder, ReminderType } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { DatePickerInput } from "react-native-paper-dates";
import { CustomRadioButton } from "../CustomRadioButton";

export default function ReminderRow({
  reminder,
  testimonyId,
}: {
  reminder: Reminder;
  testimonyId: string;
}) {
  const theme = useTheme<AppTheme>();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(reminder.scheduled_for ?? "");
  const [recurring, setRecurring] = useState(
    reminder.type !== ReminderType.ONE_TIME
  );
  const [interval, setInterval] = useState(reminder.type ?? "one-time");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const dateModalTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      surface: theme.colors.background, // modal background
      onSurface: theme.colors.onSurface, // modal text
    },
  };

  const getDaysUntil = (date: string) => {
    const today = dayjs().startOf("day");
    const scheduled = dayjs(date).startOf("day");

    const daysAway = scheduled.diff(today, "day");

    if (daysAway <= 0) return "Today 🎉";
    if (daysAway === 1) return "Tomorrow";
    return `in ${daysAway} days`;
  };

  const updateDate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reminder")
        .update({
          scheduled_for: date,
          type: interval,
        })
        .eq("uuid", reminder.uuid);
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update reminder.");
    } finally {
      setSaving(false);
      queryClient.invalidateQueries({
        queryKey: ["testimony", testimonyId],
      });
    }
  };
  const deleteReminder = async (reminderId: string) => {
    Alert.alert(
      "Delete reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("reminder")
                .delete()
                .eq("uuid", reminderId);
              if (error) throw error;
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete reminder."
              );
            } finally {
              queryClient.invalidateQueries({
                queryKey: ["testimony", testimonyId],
              });
            }
          },
        },
      ]
    );
  };

  const title = new Date(reminder.scheduled_for).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <List.Accordion
      key={reminder.uuid}
      title={title}
      description={`${reminder.type} • ${getDaysUntil(reminder.scheduled_for)}`}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      right={(props) => (
        <List.Icon {...props} icon={expanded ? "chevron-up" : "chevron-down"} />
      )}
    >
      <PaperProvider theme={dateModalTheme}>
        <DatePickerInput
          locale="en"
          label="Reminder Date"
          placeholder="Scheduled for"
          value={date ? new Date(date) : undefined}
          onChange={(d) => {
            if (d) setDate((d as Date).toISOString());
          }}
          inputMode="start"
          mode="outlined"
          saveLabel="Done"
          withDateFormatInLabel={false}
          validRange={{ startDate: new Date() }}
        />
      </PaperProvider>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingTop: 8,
        }}
      >
        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
          Recurring
        </Text>
        <Switch
          value={recurring}
          onValueChange={(value) => {
            setRecurring(value);
            if (value) setInterval(ReminderType.MONTHLY);
            else setInterval("one-time");
          }}
        />
      </View>

      {recurring && (
        <View style={{ marginTop: 8, marginLeft: 4 }}>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurface, marginBottom: 6 }}
          >
            Interval
          </Text>

          <CustomRadioButton
            selected={interval === ReminderType.BI_WEEKLY}
            onPress={() => setInterval(ReminderType.BI_WEEKLY)}
            label="Bi-Weekly"
            color={theme.colors.primary}
          />
          <CustomRadioButton
            selected={interval === ReminderType.MONTHLY}
            onPress={() => setInterval(ReminderType.MONTHLY)}
            label="Monthly"
            color={theme.colors.primary}
          />
          <CustomRadioButton
            selected={interval === ReminderType.QUARTERLY}
            onPress={() => setInterval(ReminderType.QUARTERLY)}
            label="Quarterly"
            color={theme.colors.primary}
          />
          <CustomRadioButton
            selected={interval === ReminderType.YEARLY}
            onPress={() => setInterval(ReminderType.YEARLY)}
            label="Yearly"
            color={theme.colors.primary}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => deleteReminder(reminder.uuid)}
          buttonColor="rgba(179, 38, 30, 1)"
        >
          Delete
        </Button>
        <Button
          mode="contained-tonal"
          loading={saving}
          disabled={saving}
          onPress={updateDate}
        >
          Save
        </Button>
      </View>
    </List.Accordion>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 16, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
});
