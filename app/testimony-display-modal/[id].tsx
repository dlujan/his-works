import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";

const IMAGE_INTERVAL = 3000; // ms between transitions
const FADE_DURATION = 1000;

export default function TestimonyDisplayModal() {
  const { id, reminderId } = useLocalSearchParams<{
    id?: string;
    reminderId?: string;
  }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const theme = useTheme<AppTheme>();

  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const [imageIndex, setImageIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);

  const titleOptions = [
    "Remember this moment?",
    "Thank God again for this",
    "Reflect on God's faithfulness",
    "Remember how God moved?",
  ];
  const subtitlesOptions = [
    "Revisit this testimony of God's faithfulness.",
    "Remember this moment when God showed up.",
    "Take a moment to reflect on this answered prayer.",
    "Look back on this work of God in your life.",
  ];

  const images = testimony?.images?.map((i) => i.image_path) ?? [];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setTitle(titleOptions[Math.floor(Math.random() * titleOptions.length)]);
    setSubtitle(
      subtitlesOptions[Math.floor(Math.random() * subtitlesOptions.length)]
    );
  }, []);

  useEffect(() => {
    if (!reminderId) return;

    const markReminderNotificationsRead = async () => {
      const { error } = await supabase
        .from("notification")
        .update({ read: true })
        .eq("type", "reminder")
        .eq("read", false)
        .eq("data->>reminder_uuid", reminderId);

      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.uuid],
      });

      if (error) {
        console.error("Failed to mark reminder notifications read:", error);
      }
    };

    markReminderNotificationsRead();
  }, [reminderId]);

  const fetchTestimony = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("testimony")
      .select("*, user(full_name, avatar_url), testimony_image(*)")
      .eq("uuid", id)
      .single();

    if (!error && data) {
      setTestimony({
        ...data,
        images: data.testimony_image.sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ),
      });
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTestimony();
  }, [fetchTestimony]);

  const handleShare = async () => {
    if (!testimony) return;
    if (Platform.OS === "ios") {
      try {
        await Share.share({
          title: "Shared testimony",
          message: `${testimony.text} — ${testimony.user.full_name}`,
          url: "https://apps.apple.com/us/app/hisworks/id6754654556",
        });
      } catch (error) {
        console.warn("Unable to share testimony", error);
      }
    } else {
      try {
        await Share.share({
          title: "Shared testimony",
          message: `${testimony.text} — ${testimony.user.full_name}`,
        });
      } catch (error) {
        console.warn("Unable to share testimony", error);
      }
    }
  };

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  useEffect(() => {
    if (!hasMultipleImages) return;

    const interval = setInterval(() => {
      const next = (imageIndex + 1) % images.length;
      setNextIndex(next);

      // Reset fade values
      fadeInAnim.setValue(0);
      fadeOutAnim.setValue(1);

      // Run both fade animations in parallel
      Animated.parallel([
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeOutAnim, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // When done, swap the images
        setImageIndex(next);
        fadeInAnim.setValue(1);
        fadeOutAnim.setValue(2);
      });
    }, IMAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [imageIndex, hasMultipleImages, images.length]);

  if (loading || !testimony) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating color={theme.colors.primary} />
      </View>
    );
  }

  const baseImage =
    images[imageIndex] ||
    testimony.image_url ||
    "https://images.pexels.com/photos/1105389/pexels-photo-1105389.jpeg";

  const nextImage = hasMultipleImages
    ? images[nextIndex]
    : "https://images.pexels.com/photos/1105389/pexels-photo-1105389.jpeg";

  return (
    <View style={styles.background}>
      <Animated.Image
        source={{ uri: baseImage }}
        style={[StyleSheet.absoluteFill, { opacity: fadeOutAnim }]}
        resizeMode="cover"
      />

      <Animated.Image
        source={{ uri: nextImage }}
        style={[StyleSheet.absoluteFill, { opacity: fadeInAnim }]}
        resizeMode="cover"
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.text}>“{testimony.text}”</Text>

        {testimony.bible_verse && (
          <Text style={styles.verse}>{testimony.bible_verse}</Text>
        )}

        <Text style={styles.author}>— {testimony.user.full_name}</Text>
        <Text style={styles.date}>{formatDate(testimony.created_at)}</Text>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <IconButton
          icon="share-outline"
          iconColor="#fff"
          size={28}
          onPress={handleShare}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    paddingTop: 75,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#fff",
    opacity: 0.95,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.85,
    color: "#fff",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  text: {
    fontSize: 22,
    lineHeight: 34,
    fontFamily: "PTSerifRegular",
    color: "#fff",
    textAlign: "center",
  },
  verse: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#fff",
    marginTop: 16,
    opacity: 0.9,
  },
  author: {
    marginTop: 28,
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  date: {
    fontSize: 14,
    opacity: 0.8,
    color: "#fff",
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 30,
  },
});
