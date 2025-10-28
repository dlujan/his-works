// app/Welcome.tsx
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HisWorks</Text>
      <Text style={styles.subtitle}>
        A place to share and remember what God has done.
      </Text>
      <View style={styles.buttons}>
        <Button mode="contained" onPress={() => router.push("/about")}>
          Let's Begin
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
  },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  buttons: { width: "100%", marginTop: 10, gap: 15 },
});
