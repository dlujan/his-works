import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const IMAGE_INTERVAL = 3000; // ms between transitions
const FADE_DURATION = 1000;

const reflectionQuestionSets = {
  presence_trust: [
    "Where did you see God in this moment?",
    "What does this show you about His character?",
    "How does this shape the way you trust Him now?",
  ],

  gratitude_anchor: [
    "What stands out most to you about this moment?",
    "What are you thankful for as you remember it?",
    "What would you want to remember about this in the future?",
  ],

  faith_movement: [
    "How did you see God move in this situation?",
    "What did it require of your faith?",
    "How does this influence the way you walk forward today?",
  ],

  peace_assurance: [
    "What part of this moment means the most to you?",
    "What does this remind you about God's faithfulness?",
    "How does remembering this bring you peace today?",
  ],
};

export default function TestimonyDisplayModal() {
  const { id, reminderId, notificationIsRead } = useLocalSearchParams<{
    id?: string;
    reminderId?: string;
    notificationIsRead?: string;
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

  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionStep, setReflectionStep] = useState(0);
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>([
    "",
    "",
    "",
  ]);
  const [savingReflection, setSavingReflection] = useState(false);
  const [isReflectionComplete, setIsReflectionComplete] = useState(false);
  const [reflectionQuestions, setReflectionQuestions] = useState<string[]>([]);
  const [reflectionExists, setReflectionExists] = useState(false);

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
    const isRead = !!notificationIsRead && notificationIsRead === "true";
    if (!reminderId || isRead) return;

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
  }, [reminderId, notificationIsRead]);

  useEffect(() => {
    if (!reminderId || !user?.uuid) {
      return;
    }

    let cancelled = false;

    const checkExistingReflection = async () => {
      try {
        const { data, error } = await supabase
          .from("testimony_reflection")
          .select("uuid")
          .eq("user_uuid", user.uuid)
          .eq("reminder_uuid", reminderId)
          .single();

        if (error) throw error;
        if (!cancelled) {
          setReflectionExists(!!data);
        }
      } catch (e) {
        console.warn("Failed to check reminder reflection:", e);
        if (!cancelled) setReflectionExists(false);
      }
    };

    checkExistingReflection();

    return () => {
      cancelled = true;
    };
  }, [reminderId, user?.uuid]);

  const transition = useRef(new Animated.Value(0)).current;
  // 0 = testimony view, 1 = reflection view
  const completeTransition = useRef(new Animated.Value(0)).current;

  const animateTo = (toReflection: boolean) => {
    Animated.timing(transition, {
      toValue: toReflection ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };
  const animateCompleteTo = (toComplete: boolean) => {
    Animated.timing(completeTransition, {
      toValue: toComplete ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

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

  const startReflection = () => {
    const { key, questions } = getRandomReflectionSet();

    setReflectionQuestions(questions);

    setReflectionAnswers(["", "", ""]);
    setReflectionStep(0);
    setIsReflectionComplete(false);
    completeTransition.setValue(0);

    setIsReflecting(true);
    animateTo(true);
  };

  const cancelReflection = () => {
    completeTransition.setValue(0);
    setIsReflecting(false);
    animateTo(false);
  };

  const updateAnswer = (index: number, text: string) => {
    setReflectionAnswers((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const goNext = () => {
    Keyboard.dismiss();
    setReflectionStep((s) => Math.min(s + 1, reflectionQuestions.length - 1));
  };

  const finishReflection = async () => {
    Keyboard.dismiss();

    // ✅ Check if every answer is empty or whitespace
    const hasAnyContent = reflectionAnswers.some(
      (answer) => answer.trim().length > 0
    );

    try {
      if (hasAnyContent) {
        setSavingReflection(true);

        const { error } = await supabase
          .from("testimony_reflection")
          .insert({
            testimony_uuid: testimony?.uuid,
            user_uuid: user?.uuid,
            reminder_uuid: reminderId,
            response_data: {
              responses: reflectionQuestions.map((question, index) => ({
                question,
                answer: reflectionAnswers[index].trim(),
              })),
            },
          })
          .select("uuid")
          .single();

        if (error) throw error;
      }

      // ✅ Always show completion screen
      setIsReflectionComplete(true);
      animateCompleteTo(true);
    } catch (error: any) {
      console.error("Error saving response:", error);
      Alert.alert(error.message || "Failed to save response.");
    } finally {
      setSavingReflection(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

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

  const getRandomReflectionSet = () => {
    const keys = Object.keys(reflectionQuestionSets);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    return {
      key: randomKey,
      questions:
        reflectionQuestionSets[
          randomKey as keyof typeof reflectionQuestionSets
        ],
    };
  };

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
        <View style={{ width: "100%", alignItems: "center" }}>
          {/* TESTIMONY VIEW */}
          <Animated.View
            pointerEvents={isReflecting ? "none" : "auto"}
            style={{
              width: "100%",
              opacity: transition.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateY: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.text}>“{testimony.text}”</Text>

            {testimony.bible_verse && (
              <Text style={styles.verse}>{testimony.bible_verse}</Text>
            )}

            <Text style={styles.author}>— {testimony.user.full_name}</Text>
            <Text style={styles.date}>{formatDate(testimony.created_at)}</Text>

            <View style={{ marginTop: 28 }} />
            {!reflectionExists && (
              <Button
                mode="contained"
                style={{ alignSelf: "center" }}
                onPress={startReflection}
              >
                Start Reflection
              </Button>
            )}
            <Button
              mode="text"
              textColor="#e6e6e6"
              style={{ marginTop: 8 }}
              onPress={handleClose}
            >
              Close
            </Button>
          </Animated.View>

          {/* REFLECTION VIEW */}
          {isReflecting && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                width: "100%",
              }}
            >
              {/* --- Reflection content (fades out when complete) --- */}
              <Animated.View
                pointerEvents={isReflectionComplete ? "none" : "auto"}
                style={{
                  width: "100%",
                  opacity: Animated.multiply(
                    transition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                    completeTransition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    })
                  ),
                  transform: [
                    {
                      translateY: completeTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                  ],
                }}
              >
                <Text style={styles.reflectionStep}>
                  Reflection {reflectionStep + 1} of{" "}
                  {reflectionQuestions.length}
                </Text>

                <Text style={styles.reflectionQuestion}>
                  {reflectionQuestions[reflectionStep]}
                </Text>

                <TextInput
                  key={`reflection-input-${reflectionStep}`}
                  mode="outlined"
                  value={reflectionAnswers[reflectionStep]}
                  onChangeText={(text) => updateAnswer(reflectionStep, text)}
                  multiline
                  numberOfLines={6}
                  placeholder="Your response..."
                  style={styles.reflectionInput}
                  textColor={theme.colors.ink}
                  placeholderTextColor="rgba(63, 36, 21, 0.65)"
                  maxLength={1200}
                  editable={!savingReflection}
                />

                <View style={styles.reflectionButtons}>
                  {reflectionStep < reflectionQuestions.length - 1 ? (
                    <Button
                      mode="contained"
                      onPress={goNext}
                      style={{ flex: 1 }}
                      disabled={savingReflection}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={finishReflection}
                      loading={savingReflection}
                      disabled={savingReflection}
                      style={{ flex: 1 }}
                    >
                      Finish
                    </Button>
                  )}
                </View>

                {!savingReflection && (
                  <Button
                    mode="text"
                    textColor="#e6e6e6"
                    style={{ marginTop: 8 }}
                    onPress={cancelReflection}
                  >
                    Cancel
                  </Button>
                )}
              </Animated.View>

              {/* --- Completion content (fades in) --- */}
              {isReflectionComplete && (
                <Animated.View
                  pointerEvents={isReflectionComplete ? "auto" : "none"}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    opacity: completeTransition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                    transform: [
                      {
                        translateY: completeTransition.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={styles.completeTitle}>Reflection complete.</Text>
                  <Text style={styles.completeSubtitle}>
                    Thanks for taking a moment to remember what God has done.
                  </Text>

                  <View style={{ marginTop: 18 }} />

                  <Button
                    mode="contained"
                    onPress={handleClose}
                    style={{ alignSelf: "center" }}
                  >
                    Close
                  </Button>
                </Animated.View>
              )}
            </View>
          )}
        </View>
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
    textAlign: "center",
    fontSize: 16,
    fontStyle: "italic",
    color: "#fff",
    marginTop: 16,
    opacity: 0.9,
  },
  author: {
    textAlign: "center",
    marginTop: 28,
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  date: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.8,
    color: "#fff",
    marginTop: 4,
  },
  reflectionStep: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.85,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  reflectionQuestion: {
    fontSize: 18,
    fontFamily: "PTSerifRegular",
    lineHeight: 26,
    color: "#fff",
    marginBottom: 14,
  },
  reflectionInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.90)",
    borderRadius: 12,
    minHeight: 100,
  },
  reflectionButtons: {
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 30,
  },
  completeTitle: {
    textAlign: "center",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "PTSerifRegular",
    color: "#fff",
  },
  completeSubtitle: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    lineHeight: 20,
    color: "#fff",
    opacity: 0.9,
  },
});
