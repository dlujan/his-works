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
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

  const [fontsLoaded] = useFonts({
    PTSerifBold: require("../assets/fonts/PTSerif-Bold.ttf"),
    PTSerifItalic: require("../assets/fonts/PTSerif-Italic.ttf"),
    PTSerifRegular: require("../assets/fonts/PTSerif-Regular.ttf"),
  });

  return (
    <PostHogProvider
      apiKey="phc_uI3qMs343V1qROZURdKCOS1pCmwI7PN4c8iNDaFBl9y"
      options={{
        host: "https://us.i.posthog.com",
      }}
      autocapture={{
        captureTouches: true,
        captureScreens: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider fontsLoaded={fontsLoaded}>
          <PaperProvider theme={paperTheme}>
            <ThemeProvider value={navigationTheme}>
              <GestureHandlerRootView>
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
                  <Stack.Screen
                    name="about2"
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
                      headerTitleStyle: { fontWeight: 600 },
                    }}
                  />
                  <Stack.Screen
                    name="signup"
                    options={{
                      headerShown: true,
                      title: "Sign up",
                      headerBackTitle: "Back",
                      headerTitleStyle: { fontWeight: 600 },
                    }}
                  />
                  <Stack.Screen
                    name="forgot-password"
                    options={{
                      headerShown: true,
                      title: "Forgot password",
                      headerBackTitle: "Back",
                      headerTitleStyle: { fontWeight: 600 },
                    }}
                  />
                  <Stack.Screen
                    name="reset-password"
                    options={{
                      headerShown: true,
                      title: "Reset password",
                      headerBackTitle: "Back",
                      headerTitleStyle: { fontWeight: 600 },
                    }}
                  />
                  <Stack.Screen
                    name="confirm-notice"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="confirm-email"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="post-confirmation"
                    options={{
                      headerShown: false,
                    }}
                  />

                  {/* Authenticated tabs area */}
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(onboarding)"
                    options={{ headerShown: false }}
                  />

                  {/* Modals, inside authenticated area */}
                  <Stack.Screen
                    name="create-testimony-modal"
                    options={{
                      presentation: "modal",
                      headerShown: true,
                      title: "Add testimony",
                      headerTitleStyle: { fontWeight: 600 },
                      headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                          <Text
                            style={{
                              color: paperTheme.colors.onSurface,
                              fontSize: 16,
                            }}
                          >
                            Cancel
                          </Text>
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
              </GestureHandlerRootView>
            </ThemeProvider>
          </PaperProvider>
        </AuthProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}
