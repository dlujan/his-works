import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/hooks/data/useProfile";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

const Profile = () => {
  const theme = useTheme<AppTheme>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, isLoading } = useProfile(id || "");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id === user!.uuid) {
      router.replace("/account");
    }
  }, [id, user]);

  if (!profile || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating color={theme.colors.primary} />
      </View>
    );
  }

  const isFollowing = profile.followers?.some(
    (f: any) => f.follower?.uuid === user?.uuid
  );
  const followerCount = profile.followers?.length ?? 0;

  const handleFollowToggle = async () => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    if (isFollowing) {
      Alert.alert(
        "Unfollow",
        `Are you sure you want to unfollow ${profile.full_name}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsUpdating(false),
          },
          {
            text: "Unfollow",
            style: "destructive",
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from("follow")
                  .delete()
                  .eq("follower_uuid", user.uuid)
                  .eq("followed_uuid", profile.uuid);

                if (error) console.error("Error unfollowing:", error.message);
              } finally {
                setIsUpdating(false);
                queryClient.invalidateQueries({
                  queryKey: ["profile", id],
                });
              }
            },
          },
        ]
      );
    } else {
      try {
        const { error } = await supabase.from("follow").insert({
          follower_uuid: user.uuid,
          followed_uuid: profile.uuid,
        });

        if (error) {
          console.error("Error following:", error.message);
        }
      } finally {
        setIsUpdating(false);
        queryClient.invalidateQueries({ queryKey: ["profile", id] });
      }
    }
  };

  return (
    <View
      style={[
        styles.profileContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.profileDetails}>
        <View style={styles.profileTextContainer}>
          <Text
            style={[styles.nameText, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {profile.full_name}
          </Text>

          <Text
            style={[
              styles.followerText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {followerCount} {followerCount === 1 ? "follower" : "followers"}
          </Text>

          <Button
            mode={isFollowing ? "outlined" : "contained"}
            loading={isUpdating}
            onPress={handleFollowToggle}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </View>

        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileContainer: {
    flexDirection: "column",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    top: -8,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileTextContainer: {
    flex: 1,
    marginRight: 12,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "600",
  },
  followerText: {
    fontSize: 14,
  },
});
