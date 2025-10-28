// app/index.tsx
import { useAuth } from "@/context/auth-context";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/welcome"} />;
}
