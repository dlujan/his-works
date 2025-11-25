import type { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { List, Surface, useTheme } from "react-native-paper";

export default function LegalScreen() {
  const { session, signOut } = useAuth();
  const theme = useTheme<AppTheme>();

  const authUser = session?.user ?? null;
  const { user } = useAuth();

  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(authUser?.email ?? "");
  // const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <Surface
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <List.Section style={{ marginHorizontal: -20 }}>
            <List.Item
              title="Privacy Policy"
              left={(props) => <List.Icon {...props} icon="lock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={async (event) => {
                if (process.env.EXPO_OS !== "web") {
                  // Prevent the default behavior of linking to the default browser on native.
                  event.preventDefault();
                  // Open the link in an in-app browser.
                  await openBrowserAsync(
                    "https://github.com/dlujan/his-works/blob/main/PRIVACY_POLICY.md",
                    {
                      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
                    }
                  );
                }
              }}
            />
            <List.Item
              title="Terms of Use"
              left={(props) => (
                <List.Icon {...props} icon="file-document-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={async (event) => {
                if (process.env.EXPO_OS !== "web") {
                  // Prevent the default behavior of linking to the default browser on native.
                  event.preventDefault();
                  // Open the link in an in-app browser.
                  await openBrowserAsync(
                    "https://github.com/dlujan/his-works/blob/main/TERMS_OF_USE.md",
                    {
                      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
                    }
                  );
                }
              }}
            />
          </List.Section>
        </ScrollView>
      </Surface>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
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
  input: {
    backgroundColor: "transparent",
  },
  saveButton: {
    marginTop: 24,
  },
  message: {
    textAlign: "center",
    marginTop: 4,
  },
});
