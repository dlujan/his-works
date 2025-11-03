import { useTestimony } from "@/hooks/data/useTestimony";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Divider, Text, useTheme } from "react-native-paper";

export default function TestimonyRemindersModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { testimony, isLoading } = useTestimony(id || "");
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating color={theme.colors.primary} />
      </View>
    );
  }

  const getDaysUntil = (date: string) => {
    const now = dayjs();
    const scheduled = dayjs(date);
    const daysAway = scheduled.diff(now, "day");

    if (daysAway <= 0) return "Today 🎉";
    if (daysAway === 1) return "Tomorrow";
    return `in ${daysAway} days`;
  };

  const reminders = testimony?.reminders ?? [];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.colors.onSurface }]}>
          Scheduled Reminders
        </Text>

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
            .map((reminder, i) => {
              const date = new Date(reminder.scheduled_for).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              );

              return (
                <View key={reminder.uuid}>
                  <View style={styles.reminderRow}>
                    <Text
                      variant="bodyLarge"
                      style={{ color: theme.colors.onSurface }}
                    >
                      {date}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {getDaysUntil(reminder.scheduled_for)}
                    </Text>
                  </View>
                  {i !== reminders.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </View>
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
  header: { marginBottom: 16 },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
});
