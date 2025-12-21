import { AppTheme, palette } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, List, Text, useTheme } from "react-native-paper";
const logo = require("../../assets/images/android-icon2-512x512.png");

export default function OnboardingReminderPreferences2() {
  const router = useRouter();
  const { session, refreshUser } = useAuth();
  const theme = useTheme<AppTheme>();
  const authUser = session?.user ?? null;

  const [settings, setSettings] = useState({
    monthly: true,
    yearly: true,
    quarterly: true,
    timeOfDay: "morning" as "morning" | "evening",
  });
  const [loading, setLoading] = useState(false);

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
  }, [authUser]);

  const handleTimeSelect = (value: "morning" | "evening") => {
    setSettings((prev) => ({ ...prev, timeOfDay: value }));
  };

  const handleSave = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user")
        .update({ reminder_settings: settings })
        .eq("uuid", authUser.id);

      if (error) throw error;
      supabase.auth.refreshSession();
      router.push("/outro");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.dark ? palette.dark : palette.surface },
      ]}
    >
      <View style={{ width: "100%", alignItems: "center" }}>
        <Image
          source={logo}
          resizeMode="contain"
          style={{
            width: 160,
            height: 160,
            marginBottom: theme.dark ? 10 : -20,
            borderRadius: 20,
          }}
        />
      </View>

      <Text
        variant="headlineSmall"
        style={{ marginBottom: 8, textAlign: "center" }}
      >
        Choose your reminder time
      </Text>
      <Text
        variant="bodyMedium"
        style={{ marginBottom: 0, textAlign: "center" }}
      >
        We send out reminders in the morning and the evening. Which time do you
        prefer?
      </Text>

      <View style={styles.listContainer}>
        {/* Time of Day Preference */}
        <List.Section style={styles.listSection}>
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
      </View>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={loading}
          loading={loading}
        >
          Save
        </Button>
        <Button
          mode="text"
          onPress={() => router.push("/outro")}
          disabled={loading}
        >
          Skip
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: palette.surface,
  },
  listContainer: {
    paddingVertical: 24,
  },
  listSection: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  buttons: { gap: 10 },
});
