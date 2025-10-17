import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  HelperText,
  List,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const theme = useTheme<AppTheme>();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const user = session?.user ?? null;

  const email = user?.email ?? "Not provided";
  const phone = user?.phone ?? "Not provided";

  const joined = useMemo(() => {
    if (!user?.created_at) {
      return "Unknown";
    }

    try {
      return new Date(user.created_at).toLocaleString();
    } catch {
      return user.created_at;
    }
  }, [user?.created_at]);

  const handleSignOut = async () => {
    setSignOutError(null);
    setLoading(true);

    try {
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log out. Please try again.";
      setSignOutError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <Appbar.Header
        mode="center-aligned"
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Appbar.Content title="Account" subtitle="Your profile and preferences" />
      </Appbar.Header>

      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
      >
        <Surface
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          elevation={2}
        >
          <View style={styles.header}>
            <Avatar.Icon
              icon="account"
              size={64}
              style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
          <View style={styles.headerText}>
            <Text variant="headlineSmall">{user?.user_metadata?.full_name ?? "Account"}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Manage your profile and preferences
            </Text>
          </View>
        </View>

        <List.Section>
          <List.Item
            title="Email"
            description={email}
            left={(props) => <List.Icon {...props} icon="email-outline" />}
          />
          <List.Item
            title="Phone"
            description={phone}
            left={(props) => <List.Icon {...props} icon="phone-outline" />}
          />
          <List.Item
            title="Joined"
            description={joined}
            left={(props) => <List.Icon {...props} icon="calendar-account" />}
          />
          <List.Item
            title="User ID"
            description={user?.id ?? "Unknown"}
            left={(props) => <List.Icon {...props} icon="identifier" />}
          />
        </List.Section>

        <HelperText
          type="error"
          visible={Boolean(signOutError)}
          style={[styles.helper, { color: theme.colors.error }]}
        >
          {signOutError ?? ""}
        </HelperText>

        <Button
          mode="contained"
          icon="logout"
          onPress={handleSignOut}
          loading={loading}
          disabled={loading}
          >
            Log out
          </Button>
        </Surface>
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  helper: {
    minHeight: 20,
  },
});
