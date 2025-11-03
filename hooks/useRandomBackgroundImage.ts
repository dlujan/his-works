import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image } from "react-native";

const IMAGE_URLS = [
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/1126380/pexels-photo-1126380.jpeg",
    "https://images.pexels.com/photos/1165981/pexels-photo-1165981.jpeg",
    "https://images.pexels.com/photos/1739262/pexels-photo-1739262.jpeg",
    "https://images.unsplash.com/photo-1522143804971-93c748148fbd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c2VyZW5lfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900",
    "https://plus.unsplash.com/premium_photo-1675355674737-ebcd16825f68?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c2VyZW5lfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1581284943246-0eb528155992?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2VyZW5lfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHNlcmVuZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1540808450974-f61b32d7db7d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHNlcmVuZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1422466654108-5e533f591881?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHBhc3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fHBhc3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900",
    "https://plus.unsplash.com/premium_photo-1670148434683-ad22a512657c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3RpbGwlMjB3YXRlcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1503891617560-5b8c2e28cbf6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3RpbGwlMjB3YXRlcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1550188225-af2e1c2529b2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fHN0aWxsJTIwd2F0ZXJzfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900",
    "https://images.unsplash.com/photo-1548266652-99cf27701ced?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2xvdWRzfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900",
];

// Utility to check if an image URL is valid

async function validateImage(url: string): Promise<boolean> {
    try {
        const result = await Image.prefetch(url);
        return result; // true if successful
    } catch {
        return false;
    }
}

export function useRandomBackgroundImage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const pickRandomImage = useCallback(async () => {
        const shuffled = [...IMAGE_URLS].sort(() => Math.random() - 0.5);

        for (const url of shuffled) {
            const valid = await validateImage(url);
            if (valid) {
                console.log(url);
                setImageUrl(url);
                return;
            }
        }
        setImageUrl(IMAGE_URLS[0]);
    }, []);

    useFocusEffect(
        useCallback(() => {
            pickRandomImage();
        }, [pickRandomImage]),
    );

    return imageUrl;
}
