import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
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
  const { session, signOut } = useAuth();
  const theme = useTheme<AppTheme>();

  const authUser = session?.user ?? null;
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(authUser?.email ?? "");
  // const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initials = useMemo(() => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  }, [name]);

  const handleSave = async () => {
    if (!authUser) return;

    setMessage(null);
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("user")
        .update({
          full_name: name,
        })
        .eq("uuid", authUser.id);

      if (updateError) throw updateError;

      if (email !== authUser?.email) {
        const { error } = await supabase.auth.updateUser({ email });
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

  const handleDelete = async () => {
    Alert.alert(
      "Delete account",
      "Are you sure you want to delete your account? All your data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const { data: _, error } = await supabase.functions.invoke(
                "delete-account",
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              if (error && error instanceof FunctionsHttpError) {
                const errorMessage = await error.context.json();
                Alert.alert(errorMessage.error.message);
                setDeleting(false);
                return;
              }
              signOut();
            } catch (error: any) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to delete account."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePhoto = async (userId: string) => {
    try {
      // setUploading(true);

      // 1️⃣ Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // images only
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.length) {
        console.log("User cancelled image picker.");
        return;
      }

      const image = result.assets[0];
      if (!image.uri) throw new Error("No image URI found!");

      // 2️⃣ Compress and convert picked image to ArrayBuffer (binary)
      const compressed = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: 512 } }], // adjust size if desired
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const arraybuffer = await fetch(compressed.uri).then((res) =>
        res.arrayBuffer()
      );

      // 3️⃣ Generate consistent filename (overwrite old one)
      const fileExt = image.uri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const filePath = `${userId}.${fileExt}`;

      // 4️⃣ Upload to Supabase Storage (upsert replaces old)
      const { data, error: uploadError } = await supabase.storage
        .from("profile pics")
        .upload(filePath, arraybuffer, {
          contentType: image.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;
      console.log("✅ Uploaded successfully:", data.path);

      // 5️⃣ Get public URL
      const { data: publicData } = supabase.storage
        .from("profile pics")
        .getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // 6️⃣ Update the user's avatar in your DB
      const { error: updateError } = await supabase
        .from("user")
        .update({ avatar_url: publicUrl })
        .eq("uuid", userId);

      if (updateError) throw updateError;

      // For immediate change
      const uncachedUrl = `${publicData.publicUrl}?v=${Date.now()}`;
      setAvatarUrl(uncachedUrl);
      //@ts-ignore
      setUser((prev) => ({ ...prev, avatar_url: uncachedUrl }));

      Alert.alert("✅ Success", "Profile photo updated!");
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to upload image."
      );
    } finally {
      // setUploading(false);
    }
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
            <TouchableOpacity onPress={() => handleChangePhoto(user!.uuid)}>
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
          {/* <TextInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          /> */}

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

          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving || deleting}
            >
              Save Changes
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              loading={deleting}
              disabled={deleting || saving}
              buttonColor={theme.colors.error}
            >
              Delete Account
            </Button>
          </View>
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
  buttons: {
    marginTop: 10,
    gap: 10,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
});
