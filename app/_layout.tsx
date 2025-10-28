// app/_layout.tsx
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
import { Button } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";

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
              <Stack.Screen name="about" />

              {/* Auth screens */}
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />

              {/* Authenticated tabs area */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Modal, inside authenticated area */}
              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  title: "New testimony",
                  headerLeft: () => (
                    <Button
                      title="Cancel"
                      onPress={() => router.back()}
                      color="#000"
                    />
                  ),
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
