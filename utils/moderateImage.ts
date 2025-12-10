import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Alert } from "react-native";

export const moderateImage = async (url: string) => {
    const { data, error } = await supabase.functions.invoke("moderate-image", {
        body: {
            image_url: url,
        },
    });
    if (error && error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        Alert.alert(errorMessage.error.message);
        return {};
    }
    return {
        flagged: data.flagged,
        categories: data.categories,
    };
};
