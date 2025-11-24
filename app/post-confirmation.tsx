import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { filterProfanity } from "@/utils/filterProfanity";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function PostConfirmation() {
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

    router.replace("/(tabs)");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text
        variant="headlineMedium"
        style={{ marginBottom: 16, textAlign: "center" }}
      >
        Account Confirmed ✅
      </Text>

      <Text
        variant="bodyMedium"
        style={{ marginBottom: 24, textAlign: "center" }}
      >
        Welcome to HisWorks! Before we get started, what's your name?
      </Text>

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

      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!fullName.trim() || loading}
        loading={loading}
      >
        Continue
      </Button>
    </View>
  );
}
