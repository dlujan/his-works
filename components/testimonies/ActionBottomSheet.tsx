import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Icon, Portal, Text, useTheme } from "react-native-paper";
import { Easing } from "react-native-reanimated";

const screenHeight = Dimensions.get("window").height;

type Action = {
  label: string;
  icon?: string;
  onPress: () => void;
  color?: string;
};

type ActionBottomSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  description?: string;
  actions: Action[];
};

export const ActionBottomSheet = ({
  visible,
  onDismiss,
  title,
  description,
  actions,
}: ActionBottomSheetProps) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          useNativeDriver: true,
          duration: 250,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Swipe-down to close gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) onDismiss();
        else
          Animated.timing(translateY, {
            toValue: 0,
            useNativeDriver: true,
            duration: 250,
            easing: Easing.out(Easing.quad),
          }).start();
      },
    })
  ).current;

  const [shouldRender, setShouldRender] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true); // mount before animation starts
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          useNativeDriver: true,
          duration: 250,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // after animation finishes, fully unmount
        setShouldRender(false);
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Portal>
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 999 }}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "#000",
              opacity: backdropOpacity,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            position: "absolute",
            bottom: 0,
            width: "100%",
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 32,
            paddingTop: 8,
            paddingHorizontal: 20,
          }}
        >
          {/* Handle Bar */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.outlineVariant,
              marginBottom: 12,
            }}
          />

          {title && (
            <Text
              variant="titleMedium"
              style={{ textAlign: "center", marginBottom: 4 }}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text
              variant="bodyMedium"
              style={{
                textAlign: "center",
                marginBottom: 16,
                color: theme.colors.onSurfaceVariant,
              }}
            >
              {description}
            </Text>
          )}

          {actions.map((action, i) => (
            <Button
              key={i}
              onPress={() => {
                action.onPress();
                onDismiss();
              }}
              textColor={action.color || theme.colors.onSurface}
              style={{
                justifyContent: "flex-start",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Text
                  variant="bodyLarge"
                  style={{
                    color: action.color || theme.colors.onSurface,
                    fontWeight: "600",
                  }}
                >
                  {action.label}
                </Text>
                {action.icon && (
                  <Icon
                    source={action.icon}
                    size={22}
                    color={action.color || theme.colors.onSurfaceVariant}
                  />
                )}
              </View>
            </Button>
          ))}
        </Animated.View>
      </View>
    </Portal>
  );
};
