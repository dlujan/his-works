import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateWorkModal() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [details, setDetails] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [img_url, setImgUrl] = useState("");

  const handleSubmit = async () => {
    const trimmedDetails = details.trim();

    const { data, error } = await supabase
      .from("testimony")
      .insert({
        user_uuid: user?.id,
        text: trimmedDetails,
        is_public: isPublic,
        image_url: img_url,
      })
      .select("*")
      .single();

    if (error) {
      console.log(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-testimonies"] });
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Surface
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Add your testimony
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Capture a work that God has done.
        </Text>

        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label="Details"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.multiline]}
          />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface }}
              >
                Share publicly
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Let others be encouraged by this testimony.
              </Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button onPress={() => router.back()}>Cancel</Button>
          <Button mode="contained" onPress={handleSubmit}>
            Add work
          </Button>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
  },
  form: {
    paddingTop: 24,
    paddingBottom: 32,
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 150,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingBottom: 24,
  },
});
