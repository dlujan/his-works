import { Stack } from "expo-router";
import React from "react";

export default function ActivityStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
