// app/about.tsx
import { AppTheme } from "@/constants/paper-theme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Icon,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

export default function AboutScreen() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header
        mode="center-aligned"
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Appbar.Content title="LOGO" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Welcome to HisWorks
        </Text>

        <Text variant="bodyMedium" style={styles.paragraph}>
          In Scripture, God's people often forgot His mighty works, and their
          faith wavered. That same forgetfulness can take root in us if we don't
          intentionally remember His faithfulness.
        </Text>
        <Text variant="bodyMedium" style={styles.paragraph}>
          <Text variant="bodyMedium" style={styles.strong}>
            HisWorks
          </Text>{" "}
          helps us avoid the mistakes of the Israelites by recording the stories
          of God's goodness, revisiting them over time, and keeping our hearts
          anchored in the truth that He is still at work today.
        </Text>

        <Text variant="headlineSmall" style={styles.subtitle}>
          How HisWorks helps
        </Text>

        <View style={styles.listItem}>
          <Icon
            source="book-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.listText}>
            Keep track of your answered prayers and praise reports
          </Text>
        </View>

        <View style={styles.listItem}>
          <Icon
            source="bell-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.listText}>
            Be reminded of His works — we'll send you occasional reminders.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Icon
            source="account-group-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.listText}>
            Encourage others with your testimonies and find encouragement in
            theirs.
          </Text>
        </View>

        <Text variant="bodyMedium" style={styles.paragraph}>
          Ready to get started? Jump in!
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.button}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push("/signup")}
          style={styles.button}
        >
          Create Account
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: 12,
    fontWeight: "bold",
    fontSize: 16,
  },
  paragraph: {
    marginBottom: 16,
    lineHeight: 22,
  },
  strong: {
    fontWeight: 700,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8, // adds space between icon and text
  },
  listText: {
    flex: 1, // allows wrapping beside the icon
    lineHeight: 20,
  },
});
