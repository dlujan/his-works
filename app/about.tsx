// app/about-intro.tsx
import { AppTheme } from "@/constants/paper-theme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";

export default function AboutIntroScreen() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Welcome to HisWorks
        </Text>

        <Text variant="bodyMedium" style={styles.paragraph}>
          When the Israelites crossed the Jordan River, God instructed them to
          take twelve stones from the riverbed and build a memorial — a reminder
          of His mighty works for generations to come.
        </Text>

        <Text variant="bodyMedium" style={styles.paragraph}>
          Those stones were a sign that when their children asked,
          <Text style={styles.italic}> “What do these stones mean?” </Text>
          they could tell of the Lord's faithfulness and power.
        </Text>

        <Text
          variant="bodySmall"
          style={[
            styles.paragraph,
            { fontStyle: "italic", textAlign: "center", opacity: 0.8 },
          ]}
        >
          — Joshua 4:1-7
        </Text>

        <Text variant="bodyMedium" style={styles.paragraph}>
          In the same way, <Text style={styles.strong}>HisWorks</Text> helps you
          build your own memorial — a record of God's goodness and grace, so
          that you'll never forget what He has done.
        </Text>

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
            onPress={() => router.push("/about2")}
            style={styles.buttonRight}
          >
            Next
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
  paragraph: {
    marginBottom: 16,
    lineHeight: 22,
  },
  strong: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  button: {
    marginTop: 10,
    alignSelf: "flex-end",
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
});
