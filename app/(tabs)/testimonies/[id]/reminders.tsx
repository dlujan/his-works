import ReminderRow from "@/components/testimonies/ReminderRow";
import { useAuth } from "@/context/auth-context";
import { useTestimony } from "@/hooks/data/useTestimony";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

export default function TestimonyRemindersModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { testimony, isLoading } = useTestimony(id || "");
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating color={theme.colors.primary} />
      </View>
    );
  }

  const createReminder = async () => {
    setCreating(true);
    try {
      const { error } = await supabase.from("reminder").insert({
        user_uuid: user!.uuid,
        testimony_uuid: testimony.uuid,
        scheduled_for: dayjs().add(2, "week").toISOString(),
        type: "one-time",
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create reminder.");
    } finally {
      setCreating(false);
      queryClient.invalidateQueries({
        queryKey: ["testimony", testimony.uuid],
      });
    }
  };

  const reminders = testimony?.reminders ?? [];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
            Scheduled Reminders
          </Text>
          <Button
            mode="contained"
            icon={"plus"}
            loading={creating}
            disabled={creating}
            compact
            onPress={createReminder}
          >
            Create
          </Button>
        </View>

        {reminders.length === 0 ? (
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: 24,
            }}
          >
            No reminders set for this testimony.
          </Text>
        ) : (
          reminders
            .slice()
            .sort(
              (a, b) =>
                new Date(a.scheduled_for).getTime() -
                new Date(b.scheduled_for).getTime()
            )
            .map((reminder) => {
              return (
                <ReminderRow
                  key={reminder.uuid}
                  reminder={reminder}
                  testimonyId={testimony.uuid}
                />
              );
            })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
});
