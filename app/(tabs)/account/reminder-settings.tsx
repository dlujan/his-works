import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  List,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";

import { type AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

export default function ReminderSettingsScreen() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [settings, setSettings] = useState({
    yearly: true,
    quarterly: true,
    surprise: true,
    timeOfDay: "morning" as "morning" | "evening",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("user")
        .select("reminder_settings")
        .eq("uuid", user.id)
        .single();

      if (!error && data?.reminder_settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.reminder_settings,
        }));
      }
    };
    loadSettings();
  }, [user]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeSelect = (value: "morning" | "evening") => {
    setSettings((prev) => ({ ...prev, timeOfDay: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("user")
        .update({ reminder_settings: settings })
        .eq("uuid", user.id);

      if (error) throw error;
      setMessage("Reminders updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to update reminder settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✨ Reminder Preview",
          body: "This is how your reminders will appear.",
        },
        trigger: null,
      });
    } catch (err) {
      console.warn("Unable to send test notification:", err);
    }
  };

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Choose how and when you'd like to be reminded of your testimonies.
        </Text>

        <List.Section style={styles.listSection}>
          <List.Item
            title="Yearly Reminder"
            description="Get a reminder on each testimony's one-year anniversary."
            left={(props) => <List.Icon {...props} icon="calendar" />}
            right={() => (
              <Switch
                value={settings.yearly}
                onValueChange={() => handleToggle("yearly")}
              />
            )}
          />
          <List.Item
            title="Quarterly (Seasons)"
            description="Receive reminders every three months for each testimony."
            left={(props) => <List.Icon {...props} icon="weather-sunny" />}
            right={() => (
              <Switch
                value={settings.quarterly}
                onValueChange={() => handleToggle("quarterly")}
              />
            )}
          />
          <List.Item
            title="Surprise Reminders"
            description="Occasionally get a random reminder for a past testimony."
            left={(props) => <List.Icon {...props} icon="gift-outline" />}
            right={() => (
              <Switch
                value={settings.surprise}
                onValueChange={() => handleToggle("surprise")}
              />
            )}
          />
        </List.Section>

        {/* Time of Day Preference */}
        <List.Section style={styles.listSection}>
          <List.Subheader>Preferred Reminder Time</List.Subheader>

          <List.Item
            title="Morning"
            description="Receive reminders earlier in the day."
            left={(props) => (
              <List.Icon
                {...props}
                icon="white-balance-sunny"
                color={
                  settings.timeOfDay === "morning"
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
            )}
            onPress={() => handleTimeSelect("morning")}
            titleStyle={
              settings.timeOfDay === "morning" && {
                fontWeight: "600",
                color: theme.colors.primary,
              }
            }
          />

          <List.Item
            title="Evening"
            description="Receive reminders later in the day."
            left={(props) => (
              <List.Icon
                {...props}
                icon="weather-night"
                color={
                  settings.timeOfDay === "evening"
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
            )}
            onPress={() => handleTimeSelect("evening")}
            titleStyle={
              settings.timeOfDay === "evening" && {
                fontWeight: "600",
                color: theme.colors.primary,
              }
            }
          />
        </List.Section>

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

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          Save Preferences
        </Button>

        <Button
          mode="outlined"
          onPress={handleTestNotification}
          style={styles.testButton}
          icon="bell-ring-outline"
        >
          Test Notification
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  subtitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  listSection: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  testButton: {
    marginTop: 8,
  },
  message: {
    textAlign: "center",
    marginTop: 6,
  },
});
