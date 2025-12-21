import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  Button,
  List,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";

import { palette, type AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import registerForPushNotificationsAsync, {
  devicePushPermissionGranted,
} from "@/utils/registerForPushNotificationsAsync";

export default function ReminderSettingsScreen() {
  const theme = useTheme<AppTheme>();
  const { session, user, refreshUser } = useAuth();
  const authUser = session?.user ?? null;

  const [settings, setSettings] = useState({
    monthly: true,
    yearly: true,
    quarterly: true,
    timeOfDay: "morning" as "morning" | "evening",
  });
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [deviceHasPermission, setDeviceHasPermission] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from("user")
        .select("reminder_settings")
        .eq("uuid", authUser.id)
        .single();

      if (!error && data?.reminder_settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.reminder_settings,
        }));
      }
    };
    loadSettings();

    (async () => {
      const granted = await devicePushPermissionGranted();
      setDeviceHasPermission(granted);
    })();
  }, [authUser]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeSelect = (value: "morning" | "evening") => {
    setSettings((prev) => ({ ...prev, timeOfDay: value }));
  };

  const handleSave = async () => {
    if (!authUser) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("user")
        .update({ reminder_settings: settings })
        .eq("uuid", authUser.id);

      if (error) throw error;
      setMessage("Reminders updated successfully!");
      supabase.auth.refreshSession();
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to update reminder settings.");
    } finally {
      setLoading(false);
    }
  };

  const enablePushNotifications = async () => {
    setRegistering(true);
    try {
      // 1. Register and get token
      const expoPushToken = await registerForPushNotificationsAsync();

      if (!expoPushToken) {
        setMessage("Please enable push notifications in your device settings.");
        return;
      }

      // 2. Save token to database
      await supabase
        .from("user")
        .update({
          expo_push_token: expoPushToken,
        })
        .eq("uuid", authUser?.id);

      setMessage("Successfully registered for push notifications.");

      // 3. Refresh user data so UI updates
      await refreshUser();
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to enable push notifications.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <List.Section style={styles.listSection}>
          <List.Subheader>
            Default Reminder Settings (Auto-Renewing)
          </List.Subheader>
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
            title="Monthly Reminder"
            description="Receive a monthly reminder for every testimony."
            left={(props) => <List.Icon {...props} icon="progress-clock" />}
            right={() => (
              <Switch
                value={settings.monthly}
                onValueChange={() => handleToggle("monthly")}
              />
            )}
          />
          {/* <List.Item
            title="Surprise Reminders"
            description="Occasionally get a random reminder for a past testimony."
            left={(props) => <List.Icon {...props} icon="gift-outline" />}
            right={() => (
              <Switch
                value={settings.surprise}
                onValueChange={() => handleToggle("surprise")}
              />
            )}
          /> */}
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
                    ? "orange"
                    : theme.colors.onSurfaceVariant
                }
              />
            )}
            onPress={() => handleTimeSelect("morning")}
            titleStyle={
              settings.timeOfDay === "morning" && {
                fontWeight: "600",
              }
            }
            descriptionStyle={theme.dark && { color: theme.colors.onSurface }}
            style={{
              borderRadius: 12,
              marginHorizontal: 16,
              backgroundColor:
                settings.timeOfDay === "morning"
                  ? theme.dark
                    ? theme.colors.primary
                    : theme.colors.primarySoft
                  : "transparent",
            }}
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
                    ? "orange"
                    : theme.colors.onSurfaceVariant
                }
              />
            )}
            onPress={() => handleTimeSelect("evening")}
            titleStyle={
              settings.timeOfDay === "evening" && {
                fontWeight: "600",
              }
            }
            descriptionStyle={theme.dark && { color: theme.colors.onSurface }}
            style={{
              borderRadius: 12,
              marginHorizontal: 16,
              backgroundColor:
                settings.timeOfDay === "evening"
                  ? theme.dark
                    ? theme.colors.primary
                    : theme.colors.primarySoft
                  : "transparent",
            }}
          />
        </List.Section>

        {message && (
          <Text
            variant="bodySmall"
            style={[
              styles.message,
              {
                color:
                  message.includes("success") ||
                  message.includes("Successfully")
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
          style={styles.actionButton}
        >
          Save Preferences
        </Button>
        {(!deviceHasPermission || !user?.expo_push_token) && (
          <Button
            mode="contained"
            onPress={enablePushNotifications}
            loading={registering}
            disabled={registering}
            style={styles.actionButton}
            buttonColor={palette.warning}
          >
            Enable Push Notifications
          </Button>
        )}
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  listSection: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  actionButton: {
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
