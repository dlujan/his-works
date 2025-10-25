import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export default async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      Notifications.scheduleNotificationAsync({
        content: {
          title: "Welcome!",
          body: "Would you like to receive reminders and encouragements about your testimonies? We'll send gentle reflections through push notifications.",
        },
        trigger: null,
      });
    } catch (e) {
      console.log(e);
    }
  }
  if (finalStatus !== "granted") {
    // return;
  }

  try {
    const expoPushToken: { data: string; type: "expo" } =
      await Notifications.getExpoPushTokenAsync({
        projectId: "02c37db9-69dc-4af9-82c6-0c0904cf63c7",
      });
    token = expoPushToken.data;
  } catch (error) {
    console.error("Error getting push token:", error);
  }

  return token;
}
