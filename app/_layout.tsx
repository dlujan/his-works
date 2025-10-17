import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, type PropsWithChildren } from "react";
import { View } from "react-native";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import "react-native-reanimated";

import {
  navigationDarkTheme,
  navigationLightTheme,
  paperDarkTheme,
  paperLightTheme,
} from "@/constants/paper-theme";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { LoginScreen } from "@/components/login-screen";
import { SignupScreen } from "@/components/signup-screen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { WorksProvider } from "@/context/works-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;
  const navigationTheme = isDark ? navigationDarkTheme : navigationLightTheme;

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navigationTheme}>
          <WorksProvider>
            <AuthGate>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
            </AuthGate>
          </WorksProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PaperProvider>
    </AuthProvider>
  );
}

function AuthGate({ children }: PropsWithChildren) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (!session) {
    return <UnauthenticatedScreens />;
  }

  return children;
}

function UnauthenticatedScreens() {
  const [showLogin, setShowLogin] = useState(true);

  if (showLogin) {
    return <LoginScreen onSwitchToSignup={() => setShowLogin(false)} />;
  }

  return <SignupScreen onSwitchToLogin={() => setShowLogin(true)} />;
}
