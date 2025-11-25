import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export default async function registerForPushNotificationsAsync() {
  // STEP 1 — Request permissions properly
  let { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  // If the user still did NOT grant permissions — stop here.
  if (status !== "granted") {
    console.log("Push notification permission NOT granted");
    return null;
  }

  // STEP 2 — Android channel setup (iOS will ignore)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  // STEP 3 — NOW get the actual Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "02c37db9-69dc-4af9-82c6-0c0904cf63c7",
  });

  const token = tokenData.data;
  console.log("Push Token:", token);

  return token;
}

export async function devicePushPermissionGranted() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
