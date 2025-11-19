import { View } from "react-native";
import { Text } from "react-native-paper";

export default function ConfirmNotice() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text
        variant="headlineMedium"
        style={{ marginBottom: 16, textAlign: "center" }}
      >
        Confirm Email
      </Text>

      <Text
        variant="bodyMedium"
        style={{ marginBottom: 24, textAlign: "center" }}
      >
        We emailed you a link to confirm your account. Please open it on this
        device.
      </Text>
    </View>
  );
}
