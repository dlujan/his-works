import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Portal, useTheme } from "react-native-paper";

const screenHeight = Dimensions.get("window").height;

type BottomSheetModalProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number; // optional fixed height
};

export const BottomSheetModal = ({
  visible,
  onDismiss,
  title,
  subtitle,
  children,
  height,
}: BottomSheetModalProps) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  // Slide up/down animation
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
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
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  // Swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        translateY.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) onDismiss();
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

  if (!shouldRender) return null;

  return (
    <Portal>
      <View style={StyleSheet.absoluteFill}>
        {/* Dimmed background */}
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "#000",
              opacity: backdropOpacity,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Bottom sheet container */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            position: "absolute",
            bottom: 0,
            width: "100%",
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingHorizontal: 20,
            paddingBottom: 32,
            minHeight: height ?? undefined,
          }}
        >
          {/* Handle bar */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.backdrop,
              marginBottom: 12,
            }}
          />

          {title && (
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Animated.Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: theme.colors.onSurface,
                  textAlign: "center",
                }}
              >
                {title}
              </Animated.Text>
            </View>
          )}

          {subtitle && (
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Animated.Text
                style={{
                  color: theme.colors.onSurface,
                  textAlign: "center",
                }}
              >
                {subtitle}
              </Animated.Text>
            </View>
          )}

          {/* 🧩 Custom content passed by parent */}
          {children}
        </Animated.View>
      </View>
    </Portal>
  );
};
