import { supabase } from "@/lib/supabase";
import { Reminder } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, List } from "react-native-paper";
import { DatePickerInput } from "react-native-paper-dates";

export default function ReminderRow({
  reminder,
  testimonyId,
}: {
  reminder: Reminder;
  testimonyId: string;
}) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(reminder.scheduled_for ?? "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
  const dateChanged =
    new Date(reminder.scheduled_for).getDate() !== new Date(date).getDate();

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
      <DatePickerInput
        locale="en"
        label="Date"
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
          disabled={!dateChanged || saving}
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
