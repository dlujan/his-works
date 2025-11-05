import HeaderTitleLogo from "@/components/HeaderTitleLogo";
import { AppTheme } from "@/constants/paper-theme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
const logo = require("../../../assets/images/icon-cropped-320x320.png");

export default function HomeStackLayout() {
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitleAlign: "center",
          headerTitle: () => <HeaderTitleLogo />,
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
                icon="magnify"
                size={26}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => router.push("/home/search")}
                style={{ margin: 0 }}
              />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search",
          headerBackTitle: "Back",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{
          title: "Testimony",
          headerBackTitle: "Back",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
      <Stack.Screen
        name="profile/[id]/index"
        options={{
          title: "",
          headerBackTitle: "Back",
          headerRight: () => (
            <View
              style={{
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 4,
              }}
            >
              {/* <IconButton
                icon="dots-horizontal"
                size={26}
                iconColor={theme.colors.onSurface}
                // onPress={() => router.push("/home/search")}
                style={{ margin: 0 }}
              /> */}
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="profile/[id]/user-followers-modal"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Followers",
          headerTitleStyle: { fontWeight: 600 },
        }}
      />
    </Stack>
  );
}
