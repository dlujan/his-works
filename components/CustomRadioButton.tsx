import { AppTheme } from "@/constants/paper-theme";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export function CustomRadioButton({
  selected,
  onPress,
  label,
  size = 22,
  color = "#3b82f6",
}: {
  selected: boolean;
  onPress: () => void;
  label?: string;
  size?: number;
  color?: string;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
      }}
    >
      {/* Outer circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner filled circle */}
        {selected && (
          <View
            style={{
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: (size * 0.55) / 2,
              backgroundColor: color,
            }}
          />
        )}
      </View>

      {/* Label if provided */}
      {label && (
        <Text
          style={{
            marginLeft: 8,
            fontSize: 15,
            color: theme.colors.onSurface,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
