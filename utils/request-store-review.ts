import * as StoreReview from "expo-store-review";
import { Linking, Platform } from "react-native";

const IOS_APP_STORE_URL = "https://apps.apple.com/app/id6754654556"; // your app id url
const ANDROID_PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME";

export async function requestReviewOrFallback() {
    try {
        const isAvailable = await StoreReview.isAvailableAsync();

        if (isAvailable) {
            // iOS: SKStoreReviewController
            // Android: Play In-App Review API
            await StoreReview.requestReview();
            return;
        }

        // Fallback: open store listing (useful on simulators/emulators or unsupported devices)
        const url = Platform.OS === "ios"
            ? IOS_APP_STORE_URL
            : ANDROID_PLAY_STORE_URL;
        if (url) await Linking.openURL(url);
    } catch (e) {
        // If anything fails, just fail silently (don’t block the user)
        console.warn("requestReview failed:", e);
    }
}
