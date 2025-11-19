import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import registerForPushNotificationsAsync from "@/utils/registerForPushNotificationsAsync";
import { useLinkingURL } from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function ConfirmEmail() {
  const router = useRouter();
  const url = useLinkingURL();
  const { refreshUser } = useAuth();

  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState(""); // for resend flow
  const [resendStatus, setResendStatus] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!url) return;

      const hashIndex = url.indexOf("#");
      const hash = hashIndex !== -1 ? url.substring(hashIndex + 1) : "";
      const params = Object.fromEntries(new URLSearchParams(hash));

      const access_token = params.access_token;
      const refresh_token = params.refresh_token;
      const error = params.error;
      const error_description = params.error_description;

      if (access_token) {
        handleValidToken(access_token, refresh_token);
        return;
      }

      // Handle expired/invalid link
      if (error && error_description) {
        setErrorMessage(error_description);
      }
    }, [url])
  );

  /**
   * When token is valid, do the full user onboarding flow:
   * 1. Set the Supabase session
   * 2. Register push notifications
   * 3. Update custom `user` table with token + name
   * 4. Fetch the user to set context
   * 5. Redirect to main UI
   */
  const handleValidToken = async (
    access_token: string,
    refresh_token: string
  ) => {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token ?? "",
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const authUser = data.session?.user;

    if (!authUser) {
      setErrorMessage("Unable to complete login.");
      return;
    }

    // Ask for push notifications
    const expoPushToken = await registerForPushNotificationsAsync();

    // Update custom user table
    if (expoPushToken) {
      await supabase
        .from("user")
        .update({
          expo_push_token: expoPushToken,
        })
        .eq("uuid", authUser.id);
    }

    // remove deep link url somehow?
    await refreshUser();
    router.replace("/post-confirmation");
  };

  async function handleResend() {
    if (!email) {
      setResendStatus("Please enter your email.");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) setResendStatus(error.message);
    else setResendStatus("A new confirmation email has been sent!");
  }

  // If expired link, show input + resend UI
  if (errorMessage) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          width: "100%",
        }}
      >
        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: "center" }}>
          {errorMessage}
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ width: "100%", marginBottom: 16 }}
        />

        <Button mode="contained" onPress={handleResend}>
          Resend Confirmation Email
        </Button>

        {!!resendStatus && (
          <Text style={{ marginTop: 16 }}>{resendStatus}</Text>
        )}
      </View>
    );
  }

  return null;
}
