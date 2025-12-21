import { AppTheme, palette } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
const logo = require("../assets/images/android-icon2-512x512.png");

export default function PostConfirmation() {
  const router = useRouter();
  const { session } = useAuth();
  const theme = useTheme<AppTheme>();
  const handleContinue = async () => {
    if (!session?.user) return;
    router.replace("/(onboarding)/name");
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
        variant="headlineMedium"
        style={{ marginBottom: 8, textAlign: "center" }}
      >
        Account Confirmed ✅
      </Text>

      <Text
        variant="bodyMedium"
        style={{ marginBottom: 24, textAlign: "center" }}
      >
        Welcome to HisWorks! Before we get started, let's get to know you
        better.
      </Text>

      <Button mode="contained" onPress={handleContinue}>
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
});
