import { palette } from "@/constants/paper-theme";
import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
const logo = require("../../assets/images/android-icon2-512x512.png");

export default function OnboardingReminderPreferences2() {
  const router = useRouter();

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
        You're all set!
      </Text>
      <Text
        variant="bodyMedium"
        style={{ marginBottom: 24, textAlign: "center" }}
      >
        Now it's time to add your first testimony. Also, be sure to check out
        your home feed or use the search tool to see how God is working in the
        lives of others.
      </Text>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => {
            router.push("/(tabs)");
            setTimeout(() => {
              router.push("/create-testimony-modal");
            }, 800);
          }}
        >
          Create First Testimony
        </Button>
        <Button mode="text" onPress={() => router.push("/(tabs)")}>
          Take me to the app
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
  buttons: { gap: 10 },
});
