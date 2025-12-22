import { AppTheme, palette } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { moderateImage } from "@/utils/moderateImage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Text,
  useTheme,
} from "react-native-paper";
const logo = require("../../assets/images/android-icon2-512x512.png");

export default function OnboardingProfilePic() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const theme = useTheme<AppTheme>();

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initials = useMemo(() => {
    if (!user?.full_name) return "?";
    return user?.full_name.charAt(0).toUpperCase();
  }, [user?.full_name]);

  const handleChangePhoto = async (userId: string) => {
    try {
      setUploading(true);

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

      // 3a Check for illicit image
      const base64 = await fetch(compressed.uri)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        );
      const { flagged, categories } = await moderateImage(base64 as string);

      if (flagged) {
        Alert.alert(
          "Inappropriate Content",
          `That image cannot be uploaded for these reasons: ${categories.join(
            ", "
          )}. Please refrain from uploading illicit images.`
        );
        return;
      }

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

      setMessage("Profile pic updated successfully!");
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to upload image."
      );
    } finally {
      setUploading(false);
      await refreshUser();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.dark ? palette.dark : palette.surface },
      ]}
    >
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
          {uploading ? (
            <ActivityIndicator />
          ) : (
            <Text
              variant="labelLarge"
              style={[styles.changePhoto, { color: theme.colors.primary }]}
            >
              Change Photo
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text
        variant="headlineMedium"
        style={{ marginBottom: 16, textAlign: "center" }}
      >
        Add a profile pic
      </Text>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => router.push("/reminder-preferences")}
          disabled={!avatarUrl || uploading}
        >
          Continue
        </Button>
        <Button
          mode="text"
          onPress={() => router.push("/reminder-preferences")}
          disabled={uploading}
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
  buttons: { gap: 10 },
});
