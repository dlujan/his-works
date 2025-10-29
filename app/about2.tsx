// app/about.tsx
import { AppTheme } from "@/constants/paper-theme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, Surface, Text, useTheme } from "react-native-paper";

export default function About2Screen() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          A place to remember and share what God has done
        </Text>

        <Text variant="bodyMedium" style={styles.paragraph}>
          Forgetfulness led Israel away from God again and again — but
          remembering keeps our faith strong.{" "}
          <Text style={styles.strong}>HisWorks</Text> helps you record the
          stories of His goodness, revisit them over time, and stay rooted in
          His faithfulness.
        </Text>

        <Text variant="headlineSmall" style={styles.subtitle}>
          What you can do
        </Text>

        <View style={styles.listItem}>
          <Icon
            source="book-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.listText}>
            Keep track of answered prayers, miracles, and everyday moments of
            grace.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Icon
            source="bell-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.listText}>
            Receive gentle reminders of what God has done — to strengthen your
            faith over time.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Icon
            source="account-group-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.listText}>
            Share your testimonies to encourage others, and be uplifted by their
            stories too.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.buttonLeft}
          >
            Back
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push("/signup")}
            style={styles.buttonRight}
          >
            Create Account
          </Button>
        </View>
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 40,
  },
  buttonLeft: {
    flex: 1,
    marginRight: 8,
  },
  buttonRight: {
    flex: 1,
    marginLeft: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  listText: {
    flex: 1,
    lineHeight: 20,
  },
});
