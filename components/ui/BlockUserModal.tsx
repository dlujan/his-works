import { palette } from "@/constants/paper-theme";
import React from "react";
import { Text, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { BottomSheetModal } from "./BottomSheetModal";

export function BlockUserModal({
  visible,
  isBlocked,
  onDismiss,
  profile,
  onBlock,
}: {
  visible: boolean;
  isBlocked: boolean;
  onDismiss: () => void;
  profile: { uuid: string; full_name: string };
  onBlock: (isBlocked: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <BottomSheetModal
      visible={visible}
      onDismiss={onDismiss}
      title={`${isBlocked ? "Unblock" : "Block"} ${profile?.full_name}?`}
    >
      <View style={{ gap: 12 }}>
        {isBlocked ? (
          <View style={{ gap: 6 }}>
            <Text
              style={{
                color: theme.colors.onSurface,
                lineHeight: 20,
              }}
            >
              You will see content they post.
            </Text>
            <Text
              style={{
                color: theme.colors.onSurface,
                lineHeight: 20,
              }}
            >
              They can find your profile or content on HisWorks.
            </Text>
            <Text
              style={{
                color: theme.colors.onSurface,
                lineHeight: 20,
              }}
            >
              They won't be notified that you unblocked them.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <Text
              style={{
                color: theme.colors.onSurface,
                lineHeight: 20,
              }}
            >
              You will no longer see content they post.
            </Text>
            <Text
              style={{
                color: theme.colors.onSurface,
                lineHeight: 20,
              }}
            >
              They won't be able to find your profile or content on HisWorks.
            </Text>
            <Text
              style={{
                color: theme.colors.onSurface,
                lineHeight: 20,
              }}
            >
              They won't be notified that you blocked them.
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          buttonColor={palette.error}
          textColor="white"
          onPress={() => {
            onBlock(isBlocked);
            onDismiss();
          }}
          style={{ marginTop: 12 }}
        >
          {isBlocked ? "Unblock" : "Block"}
        </Button>
      </View>
    </BottomSheetModal>
  );
}
