import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { palette } from "@/constants/paper-theme";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const createBtnColor = palette.surfaceSoft;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        // tabBarButton: HapticTab,
        tabBarStyle: {
          height: 75,
          paddingBottom: 0,
          paddingTop: 5,
          paddingHorizontal: 16,
        },
        tabBarLabelStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "house.fill" : "house"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="testimonies"
        options={{
          title: "Testimonies",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "book.fill" : "book"}
              color={color}
            />
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
                router.push("/create-testimony-modal");
              }}
              color={createBtnColor}
            />
          ),
          // listeners: {
          //   tabPress: (e) => {
          //     e.preventDefault();
          //   },
          // },
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "bell.fill" : "bell"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "person.fill" : "person"}
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
  color: string;
};

function CreateWorkTabButton({
  color,
  onPress,
  ...rest
}: CreateWorkTabButtonProps) {
  return (
    <View style={styles.createWrapperContainer}>
      <TouchableOpacity
        // {...rest}
        onPress={(ev) => onPress?.(ev)}
        activeOpacity={0.8}
        style={[styles.createButton, { backgroundColor: color }]}
      >
        <IconSymbol size={24} name="plus" color={palette.inkMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  createWrapperContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    zIndex: 10,
  },
  createButton: {
    width: 50,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
