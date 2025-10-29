import { Stack } from "expo-router";
import React from "react";

export default function TestimoniesStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Testimonies" }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Edit",
          headerBackTitle: "My Testimonies",
        }}
      />
    </Stack>
  );
}
