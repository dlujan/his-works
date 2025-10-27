import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Handles navigation when a push notification is tapped.
 * Supports both foreground/background and cold-start cases.
 */
export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    // 1️⃣ Handle when the app is already running (foreground/background)
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Prefer an explicit deep link if provided
        if (data.url) {
          Linking.openURL(data.url as string);
        }
      }
    );

    // 2️⃣ Handle when the app launches cold from a notification
    (() => {
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data;

        if (data.url) {
          Linking.openURL(data.url as string);
        }
      }
    })();

    return () => sub.remove();
  }, [router]);
}
