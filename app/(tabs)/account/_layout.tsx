import { Stack } from "expo-router";
import React from "react";

export default function AccountStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="account-details"
        options={{
          title: "Account Details",
          headerBackTitle: "Account",
        }}
      />
      <Stack.Screen
        name="reminder-settings"
        options={{
          title: "Reminder Settings",
          headerBackTitle: "Account",
        }}
      />
    </Stack>
  );
}
