import type { AppTheme } from "@/constants/paper-theme";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ImageBackground,
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

export default function TestimonyDisplayModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme<AppTheme>();
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [loading, setLoading] = useState(true);
  const [img, setImg] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const titleOptions = [
    "See What God Has Done",
    "A Work of God",
    "Testimony of His Faithfulness",
    "Give Thanks to God",
  ];
  const subtitlesOptions = [
    "Take a moment to remember this work of God.",
    "Pause and reflect on what He has done.",
    "Remember the faithfulness of the Lord.",
    "Let this remind you of His goodness.",
    "See how God has worked in your story.",
  ];

  useEffect(() => {
    const randomTitle =
      titleOptions[Math.floor(Math.random() * titleOptions.length)];
    setTitle(randomTitle);

    const randomSubtitle =
      subtitlesOptions[Math.floor(Math.random() * subtitlesOptions.length)];
    setSubtitle(randomSubtitle);
  }, []);

  const fetchTestimony = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("testimony")
      .select("*, user(full_name, avatar_url)")
      .eq("uuid", id)
      .single();

    if (!error && data) setTestimony(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTestimony();
  }, [fetchTestimony]);

  const handleShare = async () => {
    if (!testimony) return;
    try {
      await Share.share({
        title: "Shared testimony",
        message: `${testimony.user.full_name} — ${testimony.text}`,
      });
    } catch (error) {
      console.warn("Unable to share testimony", error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || !testimony) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri:
          testimony.image_url ||
          "https://images.pexels.com/photos/1105389/pexels-photo-1105389.jpeg",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {/* Scrollable Content */}
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
    </ImageBackground>
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
    fontWeight: "400",
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
