import { Stack } from "expo-router";
import React from "react";

export default function TestimoniesStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Edit Testimony",
          headerBackTitle: "Testimonies",
        }}
      />
    </Stack>
  );
}
