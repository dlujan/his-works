import { palette } from "@/constants/paper-theme";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
const logo = require("../assets/images/android-icon2-512x512.png");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={logo}
        resizeMode="contain"
        style={{
          width: 160,
          height: 160,
          bottom: -10,
        }}
      />
      <Text style={styles.title}>Welcome to HisWorks</Text>
      <Text style={styles.subtitle}>
        A place to remember and share what God has done.
      </Text>
      <View style={styles.buttons}>
        <Button mode="contained" onPress={() => router.push("/about")}>
          Get Started
        </Button>
        <Button mode="text" onPress={() => router.push("/login")}>
          Log In
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: palette.surface,
  },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  buttons: { width: "100%", marginTop: 10, gap: 15 },
});
