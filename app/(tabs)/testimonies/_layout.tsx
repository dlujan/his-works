import { Stack } from "expo-router";
import React from "react";

export default function TestimoniesStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "My Testimonies",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: "Edit",
          headerBackTitle: "My Testimonies",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
      <Stack.Screen
        name="[id]/reminders"
        options={{
          presentation: "modal",
          title: "Reminders",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
    </Stack>
  );
}
