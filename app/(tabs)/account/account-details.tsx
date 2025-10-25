import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function AccountDetailsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const theme = useTheme<AppTheme>();

  const user = session?.user ?? null;
  const initialProfile = user?.user_metadata ?? {};

  const [name, setName] = useState(initialProfile.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initials = useMemo(() => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  }, [name]);

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const { error: updateError } = await supabase.from("user").insert({
        full_name: name,
        avatar_url: avatarUrl,
      });

      if (updateError) throw updateError;

      if (email !== user?.email || phone !== user?.phone) {
        const { error } = await supabase.auth.updateUser({ email, phone });
        if (error) throw error;
      }

      setMessage("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    // placeholder: integrate with expo-image-picker or file picker
    console.log("Change photo pressed");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <Surface
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Avatar.Text
                size={96}
                label={initials}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                color={theme.colors.onPrimaryContainer}
              />
            )}
            <TouchableOpacity onPress={handleChangePhoto}>
              <Text
                variant="labelLarge"
                style={[styles.changePhoto, { color: theme.colors.primary }]}
              >
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          {message && (
            <Text
              variant="bodySmall"
              style={[
                styles.message,
                {
                  color: message.includes("success")
                    ? "green"
                    : theme.colors.error,
                },
              ]}
            >
              {message}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </ScrollView>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
  },
  changePhoto: {
    marginTop: 4,
  },
  input: {
    backgroundColor: "transparent",
  },
  saveButton: {
    marginTop: 24,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
});
