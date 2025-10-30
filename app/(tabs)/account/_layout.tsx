import { AppTheme } from "@/constants/paper-theme";
import { useAuth } from "@/context/auth-context";
import { Stack } from "expo-router";
import React from "react";
import { Alert, View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";

export default function AccountStackLayout() {
  const { signOut } = useAuth();
  const theme = useTheme<AppTheme>();
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.";
      Alert.alert(message);
    }
  };
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Account",
          headerTitleStyle: { fontWeight: 600 },
          headerRight: () => (
            <View
              style={{
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 4,
              }}
            >
              <IconButton
                icon="logout"
                size={24}
                iconColor={theme.colors.onSurface}
                onPress={handleSignOut}
                accessibilityLabel="Log out"
              />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="account-details"
        options={{
          title: "Account Details",
          headerBackTitle: "Account",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
      <Stack.Screen
        name="reminder-settings"
        options={{
          title: "Reminder Settings",
          headerBackTitle: "Account",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
      <Stack.Screen
        name="legal"
        options={{
          title: "Legal",
          headerBackTitle: "Account",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
    </Stack>
  );
}
