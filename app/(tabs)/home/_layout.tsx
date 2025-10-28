import { Stack } from "expo-router";
import React from "react";

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="search"
        options={{
          title: "Search",
          headerBackTitle: "Your Feed",
        }}
      />
      {/* <Stack.Screen
        name="[id]"
        options={{
          title: 'Testimony',
          headerBackTitle: 'Home',
        }}
      /> */}
    </Stack>
  );
}
