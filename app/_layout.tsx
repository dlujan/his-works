// app/_layout.tsx
import HeaderTitleLogo from "@/components/HeaderTitleLogo";
import {
  navigationDarkTheme,
  navigationLightTheme,
  paperDarkTheme,
  paperLightTheme,
} from "@/constants/paper-theme";
import { AuthProvider } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";
import { ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, TouchableOpacity } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
const logo = require("../assets/images/icon-cropped-320x320.png");

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();
  const router = useRouter();

  const isDark = colorScheme === "dark";
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;
  const navigationTheme = isDark ? navigationDarkTheme : navigationLightTheme;

  useNotificationNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={paperTheme}>
          <ThemeProvider value={navigationTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Unauthenticated screens */}
              <Stack.Screen name="welcome" />
              <Stack.Screen
                name="about"
                options={{
                  headerShown: true,
                  headerBackTitle: "Back",
                  headerTitle: () => <HeaderTitleLogo />,
                }}
              />

              {/* Auth screens */}
              <Stack.Screen
                name="login"
                options={{
                  headerShown: true,
                  title: "Log in",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="signup"
                options={{
                  headerShown: true,
                  title: "Sign up",
                  headerBackTitle: "Back",
                }}
              />

              {/* Authenticated tabs area */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Modals, inside authenticated area */}
              <Stack.Screen
                name="create-testimony-modal"
                options={{
                  presentation: "modal",
                  headerShown: true,
                  title: "Add testimony",
                  headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                      <Text style={{ fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                  ),
                }}
              />
              <Stack.Screen
                name="testimony-display-modal/[id]"
                options={{
                  presentation: "modal",
                  headerShown: false,
                  title: "New testimony",
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
