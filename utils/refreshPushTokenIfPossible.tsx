import * as Notifications from "expo-notifications";

export async function refreshPushTokenIfPossible() {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      return null; // User has notifications off → nothing to do
    }

    // If permissions are granted, generate a new Expo token
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: "02c37db9-69dc-4af9-82c6-0c0904cf63c7",
    });

    return expoPushToken.data;
  } catch (e) {
    console.log("Error refreshing push token", e);
    return null;
  }
}
