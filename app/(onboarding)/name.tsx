import { palette } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { filterProfanity } from "@/utils/filterProfanity";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Keyboard, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
const logo = require("../../assets/images/android-icon2-512x512.png");

export default function OnboardingName() {
  const router = useRouter();
  const { session, refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!session?.user) return;
    setLoading(true);

    const moderatedName = filterProfanity(fullName.trim());

    await supabase
      .from("user")
      .update({
        full_name: moderatedName,
      })
      .eq("uuid", session.user.id);

    await refreshUser();

    router.push("/profile-pic");
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
        variant="headlineMedium"
        style={{ marginBottom: 8, textAlign: "center" }}
      >
        What's your name?
      </Text>

      <View style={{ width: "100%" }}>
        <TextInput
          label="Your Name"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={{ marginBottom: 24 }}
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!fullName.trim() || loading}
          loading={loading}
        >
          Continue
        </Button>
        <Button
          mode="text"
          onPress={() => router.push("/profile-pic")}
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
  buttons: { gap: 10 },
});
