import { TagMultiSelect } from "@/components/TagMultiSelect";
import { type AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useTags } from "@/hooks/data/useTags";
import { useTestimony } from "@/hooks/data/useTestimony";
import { supabase } from "@/lib/supabase";
import { ReminderType } from "@/lib/types";
import { filterProfanity } from "@/utils/filterProfanity";
import { moderateImage } from "@/utils/moderateImage";
import { getNextReminder, setNextReminderDate } from "@/utils/reminders";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
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

export default function EditTestimonyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const { session, user } = useAuth();
  const authUser = session?.user ?? null;
  const queryClient = useQueryClient();
  const { tags: availableTags } = useTags();
  const { testimony, isLoading } = useTestimony(id || "");
  const [details, setDetails] = useState(testimony?.text ?? "");
  const [bibleVerse, setBibleVerse] = useState(testimony?.bible_verse ?? "");
  const [date, setDate] = useState(testimony?.date ?? "");
  const [tags, setTags] = useState<string[]>(testimony?.tags ?? []);
  const [isPublic, setIsPublic] = useState(testimony?.is_public);
  const [isPrivate, setIsPrivate] = useState(testimony?.is_private);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<
    {
      uuid?: string;
      localUri?: string;
      compressedUri?: string;
      remoteUrl?: string;
      uploading: boolean;
      isNew?: boolean;
      sort_order?: number;
    }[]
  >([]);
  const [previewImageUri, setPreviewImageUri] = useState<
    string | null | undefined
  >(null);

  const dateModalTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      surface: theme.colors.background, // modal background
      onSurface: theme.colors.onSurface, // modal text
    },
  };

  useEffect(() => {
    if (testimony) {
      setDetails(testimony.text);
      setBibleVerse(testimony.bible_verse || "");
      setDate(testimony.date);
      setIsPublic(testimony.is_public);
      setIsPrivate(testimony.is_private);
      setTags(testimony.tags ?? []);
      setSelectedImages(
        //@ts-ignore
        testimony.images
          ?.map((img) => ({
            uuid: img.uuid,
            localUri: img.image_path,
            compressedUri: img.image_path,
            remoteUrl: img.image_path,
            uploading: false,
            isNew: false,
            sort_order: img.sort_order,
          }))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
    }
  }, [testimony]);

  useEffect(() => {
    if (isPrivate && isPublic) {
      setIsPublic(false);
    }
  }, [isPrivate]);

  // ✅ Save / Update
  const handleSave = async () => {
    if (!id || !authUser) return;
    setLoading(true);
    setMessage(null);

    const moderatedText = filterProfanity(details.trim());
    const moderatedBibleVerse = bibleVerse.trim()
      ? filterProfanity(bibleVerse.trim())
      : null;

    try {
      // 1️⃣ Update the main testimony record
      const { error: updateError } = await supabase
        .from("testimony")
        .update({
          text: moderatedText,
          bible_verse: moderatedBibleVerse,
          date: date || testimony?.created_at,
          is_public: isPublic,
          is_private: isPrivate,
        })
        .eq("uuid", id)
        .eq("user_uuid", authUser.id);

      if (updateError) throw updateError;

      // 2️⃣ Clear existing tag relationships
      const { error: deleteTagsError } = await supabase
        .from("testimony_tag")
        .delete()
        .eq("testimony_uuid", id);

      if (deleteTagsError) throw deleteTagsError;

      // 3️⃣ Re-insert selected tags (linking to global `tag` table)
      for (const tagName of tags) {
        // Find or create the tag
        const { data: existingTag, error: tagFetchError } = await supabase
          .from("tag")
          .select("*")
          .eq("name", tagName)
          .single();

        if (tagFetchError) throw tagFetchError;

        let tagId = existingTag?.uuid;

        // Insert into join table
        const { error: linkError } = await supabase
          .from("testimony_tag")
          .insert({ testimony_uuid: id, tag_uuid: tagId });

        if (linkError) throw linkError;
      }

      // 🕒 4️⃣ Check if the testimony date changed — if so, reschedule reminders
      let dateChanged = false;
      if (date && date !== testimony?.date) {
        dateChanged = true;
        // Delete all *unsent* reminders for this testimony
        const { error: deleteReminderError } = await supabase
          .from("reminder")
          .delete()
          .eq("testimony_uuid", id)
          .is("sent_at", null);

        if (deleteReminderError) throw deleteReminderError;

        // Recalculate new reminders using the same logic you use at creation
        const newReminders = [];
        const testimonyDate = date ? dayjs(date) : dayjs();

        if (user?.reminder_settings?.yearly) {
          newReminders.push({
            user_uuid: user.uuid,
            testimony_uuid: id,
            scheduled_for: setNextReminderDate(testimonyDate, "year"),
            type: ReminderType.YEARLY,
          });
        }

        if (user?.reminder_settings?.quarterly) {
          newReminders.push({
            user_uuid: user.uuid,
            testimony_uuid: id,
            scheduled_for: setNextReminderDate(testimonyDate, "quarter"),
            type: ReminderType.QUARTERLY,
          });
        }

        if (newReminders.length > 0) {
          const { error: insertError } = await supabase
            .from("reminder")
            .insert(newReminders);
          if (insertError) throw insertError;
        }
      }

      // 5️⃣ Insert/upsert images
      const originalImages = testimony.images || []; // from the DB
      const currentImages = selectedImages; // from state

      const deleted = originalImages.filter(
        (o) => !currentImages.some((c) => c.remoteUrl === o.image_path)
      );

      // Delete removed images
      for (const img of deleted) {
        // Delete DB row
        await supabase.from("testimony_image").delete().eq("uuid", img.uuid);

        // Delete file from storage
        // Extract path from full URL:
        const storagePath = img.image_path.split("/testimony_pics/")[1];

        if (storagePath) {
          await supabase.storage.from("testimony_pics").remove([storagePath]);
        }
      }

      // Upload new images, update sort order for kept images
      for (let index = 0; index < currentImages.length; index++) {
        const img = currentImages[index];

        if (!img.isNew) {
          // Update order
          await supabase
            .from("testimony_image")
            .update({
              sort_order: index,
            })
            .eq("image_path", img.remoteUrl);
        } else {
          const imageUuid = uuid.v4() as string;
          const filePath = `${id}/${imageUuid}.jpg`;

          const arraybuffer = await fetch(img.compressedUri!).then((res) =>
            res.arrayBuffer()
          );

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

          await supabase.from("testimony_image").insert({
            testimony_uuid: id,
            image_path: publicImgUrl,
            sort_order: index,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["testimony", id] });
      queryClient.invalidateQueries({
        queryKey: ["my-testimonies", user!.uuid],
      });
      if (dateChanged) {
        setMessage(
          "Success! Your testimony has been updated and your reminders have been rescheduled."
        );
      } else {
        setMessage("Success! Your testimony has been updated.");
      }
    } catch (error: any) {
      console.error("Error updating testimony:", error);
      Alert.alert("Error", error.message || "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete
  const handleDelete = async () => {
    if (!id || !authUser) return;

    Alert.alert(
      "Delete testimony",
      "Are you sure you want to delete this testimony?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Grab images
              const { data: testimony_images } = await supabase
                .from("testimony_image")
                .select("testimony_uuid,image_path")
                .eq("testimony_uuid", id);

              // Delete testimony
              const { error } = await supabase
                .from("testimony")
                .delete()
                .eq("uuid", id)
                .eq("user_uuid", authUser.id);

              // Delete storage images (testimony_image rows will cascade)
              if (testimony_images) {
                const deletePaths = testimony_images.map(
                  (img: { image_path: string }) =>
                    img.image_path.split("/testimony_pics/")[1]
                );
                await supabase.storage
                  .from("testimony_pics")
                  .remove(deletePaths);
              }

              if (error) throw error;
              queryClient.invalidateQueries({ queryKey: ["my-testimonies"] });
              Alert.alert("Deleted", "Your testimony has been deleted.");
              router.back();
            } catch (error: any) {
              console.error("Error deleting testimony:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to delete testimony."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
            isNew: true,
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

  if (!testimony && !isLoading) {
    return (
      <Surface
        style={[styles.fallback, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          We couldn't find that testimony.
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
        >
          It may have been removed or is no longer available.
        </Text>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go back
        </Button>
      </Surface>
    );
  }
  const nextReminderText = testimony?.reminders
    ? getNextReminder(testimony.reminders)
    : null;

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.topRow}
            onPress={() => router.push(`/testimonies/${id}/reminders`)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon
                source="bell-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              {nextReminderText ? (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginLeft: 6,
                  }}
                >
                  Next reminder {nextReminderText}
                </Text>
              ) : (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginLeft: 6,
                    textDecorationLine: "underline",
                  }}
                >
                  Reminder settings
                </Text>
              )}
            </View>
            <Link href={`/testimonies/${id}/post`}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                View Post
              </Text>
            </Link>
          </TouchableOpacity>

          <TextInput
            label="My testimony"
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={8}
            maxLength={1000}
            style={[styles.input, styles.multiline]}
          />

          <TextInput
            label="Bible verse"
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
              value={date ? new Date(date) : undefined}
              onChange={(d) => {
                if (d) setDate((d as Date).toISOString());
              }}
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
              availableTags={availableTags}
              tags={tags}
              setTags={setTags}
            />

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
          </View>

          {/* Button to open image picker */}
          <Button
            mode="outlined"
            onPress={handleSelectImages}
            icon="image-multiple"
            style={{ marginBottom: 12 }}
          >
            Select Photos
          </Button>

          {selectedImages && selectedImages.length > 0 && (
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

          {message && (
            <Text
              variant="bodySmall"
              style={[
                styles.message,
                {
                  color: message.includes("Success")
                    ? "green"
                    : theme.colors.error,
                },
              ]}
            >
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            >
              Save changes
            </Button>
            <Button
              onPress={() => router.push(`/testimony-display-modal/${id}`)}
            >
              Preview
            </Button>
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={handleDelete}
              disabled={loading}
            >
              Delete testimony
            </Button>
          </View>
        </ScrollView>
      )}
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

          <TouchableOpacity
            style={styles.modalLeftArrow}
            onPress={() => {
              const currentIndex = selectedImages.findIndex(
                (img) => img.localUri === previewImageUri
              );
              const previousIndex =
                currentIndex === 0
                  ? selectedImages.length - 1
                  : currentIndex - 1;
              const image = selectedImages[previousIndex];
              setPreviewImageUri(image.localUri);
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={[styles.fullscreenCloseText, styles.arrowText]}>
              ←
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalRightArrow}
            onPress={() => {
              const currentIndex = selectedImages.findIndex(
                (img) => img.localUri === previewImageUri
              );
              const nextIndex =
                currentIndex + 1 === selectedImages.length
                  ? 0
                  : currentIndex + 1;
              const image = selectedImages[nextIndex];
              setPreviewImageUri(image.localUri);
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={[styles.fullscreenCloseText, styles.arrowText]}>
              →
            </Text>
          </TouchableOpacity>

          {/* Image display */}
          <TouchableOpacity
            style={styles.fullscreenCloseArea}
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  multiline: {
    minHeight: 200,
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
  actions: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  backButton: {
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
  modalLeftArrow: {
    position: "absolute",
    top: Dimensions.get("screen").height / 2,
    left: 20,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRightArrow: {
    position: "absolute",
    top: Dimensions.get("screen").height / 2,
    right: 20,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.3)",
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
  arrowText: {
    lineHeight: 32,
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
