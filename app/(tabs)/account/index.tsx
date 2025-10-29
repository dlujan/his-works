import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Avatar, List, Surface, Text, useTheme } from "react-native-paper";

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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

  const handleSignOut = async () => {
    setSignOutError(null);
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.";
      setSignOutError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Avatar.Icon
              icon="account"
              size={72}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              color={theme.colors.onPrimaryContainer}
            />
          )}
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
          </View>
        </View>

        {/* List of navigation items */}
        <List.Section>
          <List.Item
            title="Account"
            description="Edit your profile information"
            left={(props) => <List.Icon {...props} icon="account-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/account/account-details")}
          />
          <List.Item
            title="Reminders"
            description="Manage your notification preferences"
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/account/reminder-settings")}
          />
        </List.Section>

        {signOutError && (
          <Text
            variant="bodySmall"
            style={[styles.errorText, { color: theme.colors.error }]}
          >
            {signOutError}
          </Text>
        )}
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
    alignItems: "center",
    marginBottom: 32,
    gap: 16,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 48,
  },
  profileText: {
    flex: 1,
  },
  errorText: {
    textAlign: "center",
    marginTop: 12,
  },
});
