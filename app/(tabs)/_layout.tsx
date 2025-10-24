import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const accentColor = Colors[colorScheme ?? "light"].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="works"
        options={{
          title: "Works",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hands.sparkles.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-work"
        options={{
          tabBarLabel: "Create",
          tabBarButton: (props) => (
            <CreateWorkTabButton
              {...props}
              onPress={() => {
                if (process.env.EXPO_OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push("/modal");
              }}
              accentColor={accentColor}
            />
          ),
          listeners: {
            tabPress: (e) => {
              e.preventDefault();
            },
          },
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.badge.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="person.crop.circle.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          headerShown: false,
          title: "HIDE",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

type CreateWorkTabButtonProps = BottomTabBarButtonProps & {
  accentColor: string;
};

function CreateWorkTabButton({
  accentColor,
  style,
  onPress,
  ...rest
}: CreateWorkTabButtonProps) {
  return (
    <PlatformPressable
      {...rest}
      onPress={(ev) => {
        onPress?.(ev);
      }}
      style={({ pressed }) => [
        styles.createWrapper,
        style,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.createButton, { backgroundColor: accentColor }]}>
        <IconSymbol size={24} name="plus" color="#000" />
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  createWrapper: {
    top: -26,
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
