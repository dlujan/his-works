import { palette } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, List, Switch, Text } from "react-native-paper";
const logo = require("../../assets/images/android-icon2-512x512.png");

export default function OnboardingReminderPreferences() {
  const router = useRouter();
  const { session, refreshUser } = useAuth();
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

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
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
      await refreshUser();
      router.push("/reminder-preferences-2");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ width: "100%", alignItems: "center" }}>
        <Image
          source={logo}
          resizeMode="contain"
          style={{
            width: 160,
            height: 160,
            bottom: -10,
          }}
        />
      </View>

      <Text
        variant="headlineSmall"
        style={{ marginBottom: 8, textAlign: "center" }}
      >
        Choose your reminder frequency
      </Text>
      <Text
        variant="bodyMedium"
        style={{ marginBottom: 0, textAlign: "center" }}
      >
        How often would you like to be reminded of your testimonies?
      </Text>

      <View style={styles.listContainer}>
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
          onPress={() => router.push("/reminder-preferences-2")}
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
