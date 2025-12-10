import { TagMultiSelect } from "@/components/TagMultiSelect";
import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useTags } from "@/hooks/data/useTags";
import { useRandomBackgroundImage } from "@/hooks/useRandomBackgroundImage";
import { supabase } from "@/lib/supabase";
import { ReminderType } from "@/lib/types";
import { filterProfanity } from "@/utils/filterProfanity";
import { moderateImage } from "@/utils/moderateImage";
import { setNextReminderDate } from "@/utils/reminders";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  PaperProvider,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { DatePickerInput } from "react-native-paper-dates";
import uuid from "react-native-uuid";

const MAX_IMAGES = 12;

export default function CreateTestimonyModal() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const authUser = session?.user ?? null;
  const { user } = useAuth();
  const { tags: availableTags } = useTags();

  const [details, setDetails] = useState("");
  const [bibleVerse, setBibleVerse] = useState("");
  const [date, setDate] = useState(new Date());
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [yearlyReminder, setYearlyReminder] = useState(
    user?.reminder_settings.yearly
  );
  const [quarterlyReminder, setQuarterlyReminder] = useState(
    user?.reminder_settings.quarterly
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<
    { localUri?: string; compressedUri?: string; uploading: boolean }[]
  >([]);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const imageUrl = useRandomBackgroundImage();

  const dateModalTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      surface: theme.colors.background, // modal background
      onSurface: theme.colors.onSurface, // modal text
    },
  };

  const handleSelectImages = async () => {
    try {
      // Already at limit? Block selection.
      if (selectedImages.length >= MAX_IMAGES) {
        Alert.alert(
          "Limit reached",
          `You can only attach up to ${MAX_IMAGES} photos.`
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      // -------------------------------------------------------------
      // 🔥 Critical Fix: Capture current count BEFORE setting state
      // -------------------------------------------------------------
      const currentCount = selectedImages.length;

      const remainingSlots = MAX_IMAGES - currentCount;

      // Only use assets that fit
      const usableAssets = result.assets.slice(0, remainingSlots);

      // If no space at all, bail out
      if (usableAssets.length === 0) {
        Alert.alert(
          "Limit reached",
          `You can only attach up to ${MAX_IMAGES} photos.`
        );
        return;
      }

      // 1️⃣ Add placeholder loader squares immediately
      const placeholders = usableAssets.map(() => ({ uploading: true }));
      setSelectedImages((prev) => [...prev, ...placeholders]);

      // -------------------------------------------------------------
      // 🔥 indexToReplace must use `currentCount`, NOT selectedImages.length
      // -------------------------------------------------------------
      const placeholderIndexOffset = currentCount;

      // 2️⃣ Process each usable asset sequentially
      for (let i = 0; i < usableAssets.length; i++) {
        const asset = usableAssets[i];
        const indexToReplace = placeholderIndexOffset + i;

        if (!asset.uri) continue;

        // ----- Compress -----
        const compressed = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // ----- Moderate -----
        const base64 = await fetch(compressed.uri)
          .then((res) => res.blob())
          .then(
            (blob) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              })
          );

        const { flagged, categories } = await moderateImage(base64);

        if (flagged) {
          Alert.alert(
            "Inappropriate Image",
            `A photo was blocked: ${categories.join(", ")}`
          );

          // Remove placeholder for this asset
          setSelectedImages((prev) =>
            prev.filter((_, idx) => idx !== indexToReplace)
          );

          continue;
        }

        // 3️⃣ Replace placeholder with real data
        setSelectedImages((prev) => {
          const updated = [...prev];

          // If something removed a slot while processing, ensure we do not overflow
          if (indexToReplace >= updated.length) return updated;

          updated[indexToReplace] = {
            localUri: asset.uri,
            compressedUri: compressed.uri,
            uploading: false,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Error selecting images:", err);
      Alert.alert("Error", "Failed to select photos.");
    } finally {
    }
  };

  const handleSubmit = async () => {
    if (!details || !authUser) return;

    setLoading(true);
    setMessage(null);

    const moderatedText = filterProfanity(details.trim());
    const moderatedBibleVerse = bibleVerse.trim()
      ? filterProfanity(bibleVerse.trim())
      : null;

    try {
      // 1️⃣ Create the testimony
      const { data: testimony, error: createError } = await supabase
        .from("testimony")
        .insert({
          user_uuid: authUser.id,
          text: moderatedText,
          bible_verse: moderatedBibleVerse,
          date: date,
          is_public: isPrivate ? false : isPublic,
          is_private: isPrivate,
          image_url: imageUrl,
        })
        .select("uuid")
        .single();

      if (createError) throw createError;

      const testimonyId = testimony.uuid;

      // 2️⃣ Insert selected tags into join table
      for (const tagName of tags) {
        const { data: existingTag, error: tagError } = await supabase
          .from("tag")
          .select("*")
          .eq("name", tagName)
          .single();

        if (tagError) throw tagError;

        const tagUuid = existingTag.uuid;

        const { error: linkError } = await supabase
          .from("testimony_tag")
          .insert({ testimony_uuid: testimonyId, tag_uuid: tagUuid });

        if (linkError) throw linkError;
      }

      // 3️⃣ Create default reminders
      const reminders = [];
      const now = dayjs();
      const testimonyDate = date ? dayjs(date) : now;

      if (yearlyReminder) {
        reminders.push({
          user_uuid: authUser.id,
          testimony_uuid: testimony.uuid,
          scheduled_for: setNextReminderDate(testimonyDate, "year"),
          type: ReminderType.YEARLY,
        });
      }

      if (quarterlyReminder) {
        reminders.push({
          user_uuid: authUser.id,
          testimony_uuid: testimony.uuid,
          scheduled_for: setNextReminderDate(testimonyDate, "quarter"),
          type: ReminderType.QUARTERLY,
        });
      }
      const { error: reminderError } = await supabase
        .from("reminder")
        .insert(reminders);

      if (reminderError) {
        console.error("Failed to create reminders:", reminderError);
      }

      // 4️⃣ Upload all selected images sequentially + insert DB rows
      for (let index = 0; index < selectedImages.length; index++) {
        const img = selectedImages[index];

        const imageUuid = uuid.v4() as string;
        const filePath = `${testimonyId}/${imageUuid}.jpg`;

        // Convert compressed image to ArrayBuffer
        const arraybuffer = await fetch(img.compressedUri!).then((res) =>
          res.arrayBuffer()
        );

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("testimony_pics")
          .upload(filePath, arraybuffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("testimony_pics")
          .getPublicUrl(filePath);

        const publicImgUrl = publicData.publicUrl;

        // Insert into testimony_image
        const { error: insertImageError } = await supabase
          .from("testimony_image")
          .insert({
            testimony_uuid: testimonyId,
            image_path: publicImgUrl,
            sort_order: index,
          });

        if (insertImageError) throw insertImageError;
      }

      queryClient.invalidateQueries({ queryKey: ["my-testimonies"] });
      router.back();
      setTimeout(() => {
        router.push(`/testimonies/${testimony.uuid}`);
      }, 500);
    } catch (error: any) {
      console.error("Error creating testimony:", error);
      setMessage(error.message || "Failed to save testimony.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPrivate && isPublic) {
      setIsPublic(false);
    }
  }, [isPrivate]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Surface
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Capture a work that God has done in your life.
          </Text>

          <TextInput
            label="Your testimony"
            placeholder="Your testimony (e.g. healing, new job, answered prayer)"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={6}
            maxLength={1000}
            style={[styles.input, styles.multiline]}
          />

          <TextInput
            label="Bible Verse"
            mode="outlined"
            value={bibleVerse}
            onChangeText={setBibleVerse}
            placeholder="e.g. Psalms 23:1"
            maxLength={44}
            style={styles.input}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={Keyboard.dismiss}
          />

          <PaperProvider theme={dateModalTheme}>
            <DatePickerInput
              locale="en"
              label="Date"
              placeholder="Date of event"
              value={date}
              onChange={(d) => d && setDate(d)}
              inputMode="start"
              mode="outlined"
              saveLabel="Done"
              withDateFormatInLabel={false}
              validRange={{ startDate: new Date(0), endDate: new Date() }}
            />
          </PaperProvider>

          {/* Tag selection */}
          <View style={{ marginBottom: 8 }}>
            <TagMultiSelect
              useModal={true}
              availableTags={availableTags}
              tags={tags}
              setTags={setTags}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface }}
              >
                Make private
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Keep this testimony private — only you can see it.
              </Text>
            </View>
            <Switch value={isPrivate} onValueChange={setIsPrivate} />
          </View>

          {!isPrivate && (
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
                  Share with everyone, not just followers.
                </Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
          )}

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

          {/* Image Picker Section */}
          <View style={{ marginVertical: 16 }}>
            <Text
              variant="titleSmall"
              style={{ marginBottom: 8, color: theme.colors.onSurface }}
            >
              Add Photos (optional)
            </Text>

            {/* Button to open image picker */}
            <Button
              mode="outlined"
              onPress={handleSelectImages}
              icon="image-multiple"
              style={{ marginBottom: 12 }}
            >
              Select Photos
            </Button>

            {/* Selected Images Grid */}
            {selectedImages.length > 0 && (
              <View style={styles.imageGrid}>
                {selectedImages.map((img, index) => (
                  <View key={index} style={styles.imageItem}>
                    {img.uploading ? (
                      // Loader placeholder
                      <View style={styles.loaderContainer}>
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            setPreviewImageUri(img.localUri as string)
                          }
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: img.localUri }}
                            style={styles.imagePreview}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>

                        {/* Remove button */}
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() =>
                            setSelectedImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={
                !details || loading || selectedImages.some((i) => i.uploading)
              }
              loading={loading}
            >
              Create Testimony
            </Button>
          </View>
        </ScrollView>
        <Modal
          visible={!!previewImageUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImageUri(null)}
        >
          <View style={styles.fullscreenContainer}>
            {/* X Close Button */}
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={() => setPreviewImageUri(null)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={styles.fullscreenCloseText}>×</Text>
            </TouchableOpacity>

            {/* Image display */}
            <TouchableOpacity
              style={styles.fullscreenCloseArea}
              onPress={() => setPreviewImageUri(null)}
              activeOpacity={1}
            >
              <Image
                source={{ uri: previewImageUri || undefined }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </Modal>
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
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  form: {
    paddingBottom: 48,
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 150,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    borderRadius: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  imageItem: {
    width: "31%", // fits 3 per row with gaps
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#ccc",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: -1,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenCloseText: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 28,
  },
  fullscreenCloseArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
});
