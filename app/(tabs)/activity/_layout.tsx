import { Stack } from "expo-router";
import React from "react";

export default function ActivityStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Activity", headerTitleStyle: { fontWeight: 600 } }}
      />
    </Stack>
  );
}
