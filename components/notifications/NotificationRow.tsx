import { AppTheme, palette } from "@/constants/paper-theme";
import { AppNotification, AppNotificationType } from "@/lib/types";
import { formatTimeSince } from "@/utils/time";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Icon, List, Text, useTheme } from "react-native-paper";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

type NotificationRowProps = {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
  onDelete: (item: AppNotification) => void;
};

export default function NotificationRow({
  item,
  onOpen,
  onDelete,
}: NotificationRowProps) {
  const theme = useTheme<AppTheme>();
  const rowRef = useRef<any>(null);

  // icon logic
  const getIconSlug = (n: AppNotification) => {
    if (n.type === AppNotificationType.REMINDER)
      return n.read ? "bell-outline" : "bell-badge";
    if (n.type === AppNotificationType.LIKE) return "heart-outline";
    if (n.type === AppNotificationType.COMMENT) return "message-outline";
    return "information-outline";
  };

  // 👇 iOS Mail style animated right action
  const renderRightActions = (progress: any, dragX: any) => {
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        progress.value,
        [0, 1],
        [0.2, 1], // fade in as you drag
        "clamp"
      ),
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 1],
            [40, 0], // slide in from the right
            "clamp"
          ),
        },
      ],
    }));

    return (
      <Animated.View style={[styles.rightActionContainer, animatedStyle]}>
        <Pressable
          onPress={() => {
            rowRef.current?.close();
            onDelete(item);
          }}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Icon source="trash-can" size={20} color={palette.surface} />
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ReanimatedSwipeable
      ref={rowRef}
      friction={1.5}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <Pressable
        onPress={() => {
          rowRef.current?.close();
          onOpen(item);
        }}
        // style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <List.Item
          title={item.title ?? "Notification"}
          description={item.body ?? ""}
          titleStyle={{ color: theme.colors.onSurface, fontWeight: "600" }}
          descriptionNumberOfLines={3}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          style={{
            backgroundColor: item.read
              ? theme.colors.background
              : theme.colors.primarySoft,
            paddingVertical: 14,
          }}
          left={(props) => (
            <List.Icon
              {...props}
              icon={getIconSlug(item)}
              color={
                !item.read
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
            />
          )}
          right={() => (
            <View style={styles.itemMeta}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {formatTimeSince(item.created_at)}
              </Text>
            </View>
          )}
        />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  itemMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  rightActionContainer: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.error,
  },
  deleteButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});
