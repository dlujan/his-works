import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useMyFollowers } from "@/hooks/data/useMyFollowers";
import * as Linking from "expo-linking";
import * as MailComposer from "expo-mail-composer";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, List, Surface, Text, useTheme } from "react-native-paper";

export default function AccountScreen() {
  const { session } = useAuth();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: followersData } = useMyFollowers(user?.uuid || "");
  const followersCount = followersData?.pages?.[0]?.totalCount ?? 0;

  const authUser = session?.user ?? null;
  const email = authUser?.email ?? "Not provided";

  const joined = useMemo(() => {
    if (!authUser?.created_at) return "Unknown";
    try {
      return new Date(authUser.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return authUser.created_at;
    }
  }, [authUser?.created_at]);

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileText}>
            <Text variant="headlineSmall" style={{ fontWeight: "600" }}>
              {user?.full_name ?? "Your Account"}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {email}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            >
              Joined {joined}
            </Text>
            <View style={styles.profileFooter}>
              <TouchableOpacity
                onPress={() => router.push("/account/my-followers-modal")}
              >
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                >
                  {followersCount}{" "}
                  {followersCount === 1 ? "follower" : "followers"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Avatar.Icon
              icon="account"
              size={72}
              style={{
                backgroundColor: theme.colors.primaryContainer,
                top: -8,
              }}
              color={theme.colors.onPrimaryContainer}
            />
          )}
        </View>

        {/* <Link href="/post-confirmation">
          <Text>Onboarding</Text>
        </Link> */}

        {/* List of navigation items */}
        <List.Section style={{ marginHorizontal: -20 }}>
          <List.Item
            title="Account"
            // description="Edit your profile information"
            left={(props) => <List.Icon {...props} icon="account-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/account/account-details")}
          />
          <List.Item
            title="Reminders"
            // description="Manage your notification preferences"
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/account/reminder-settings")}
          />
          <List.Item
            title="Blocked Accounts"
            // description="Legal documents and such"
            left={(props) => (
              <List.Icon {...props} icon="account-off-outline" />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/account/blocked-accounts")}
          />
          <List.Item
            title="Feedback Board"
            // description="Legal documents and such"
            left={(props) => <List.Icon {...props} icon="lightbulb-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              const url = `https://hisworks.userjot.com`;
              Linking.openURL(url);
            }}
          />
          <List.Item
            title="Contact Support"
            left={(props) => <List.Icon {...props} icon="email-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={async () => {
              MailComposer.composeAsync({
                recipients: ["daniel.lujan96@gmail.com"],
                subject: "Support Request",
              });
            }}
          />
          <List.Item
            title="Legal"
            // description="Legal documents and such"
            left={(props) => <List.Icon {...props} icon="scale-balance" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/account/legal")}
          />
        </List.Section>
      </View>
    </Surface>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 48,
    top: -8,
  },
  profileText: {
    flex: 1,
  },
  profileFooter: {
    marginTop: 10,
  },
  errorText: {
    textAlign: "center",
    marginTop: 12,
  },
});
