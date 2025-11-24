import type { Theme } from "@react-navigation/native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import type { MD3Theme } from "react-native-paper";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";

export const palette = {
  background: "#FFF4EC",
  surface: "#FBE6D4",
  surfaceSoft: "#EFD9C5",
  ink: "#36241A",
  inkMuted: "#6B4E3D",
  primary: "#3F7D3C",
  primarySoft: "#A6D8AA",
  success: "#4F7D58",
  error: "rgba(179, 38, 30, 1)",
  logoBackground: "#FCE7CF",
} as const;

type PaletteColors = typeof palette;
type AppTheme = MD3Theme & { colors: MD3Theme["colors"] & PaletteColors };

export type { AppTheme };

const lightElevation = {
  level0: "transparent",
  level1: "rgba(59, 35, 21, 0.06)",
  level2: "rgba(59, 35, 21, 0.08)",
  level3: "rgba(59, 35, 21, 0.1)",
  level4: "rgba(59, 35, 21, 0.12)",
  level5: "rgba(59, 35, 21, 0.14)",
} as const;

const lightOverrides = {
  background: palette.background,
  surface: palette.surface,
  surfaceBright: "rgba(244, 229, 214, 0.95)",
  surfaceVariant: palette.surfaceSoft,
  surfaceTint: palette.primary,
  primary: palette.primary,
  onPrimary: "#F6FFF6",
  primaryContainer: palette.primarySoft,
  onPrimaryContainer: "#12361A",
  secondary: palette.primary,
  onSecondary: "#F6FFF6",
  secondaryContainer: palette.primarySoft,
  onSecondaryContainer: "#12361A",
  tertiary: palette.surface,
  onTertiary: palette.ink,
  tertiaryContainer: palette.surfaceSoft,
  onTertiaryContainer: palette.ink,
  outline: palette.inkMuted,
  outlineVariant: "rgba(63, 36, 21, 0.3)",
  onSurface: palette.ink,
  onSurfaceVariant: "rgba(63, 36, 21, 0.65)",
  onSurfaceDisabled: "rgba(63, 36, 21, 0.38)",
  onBackground: palette.ink,
  inverseSurface: palette.ink,
  inverseOnSurface: palette.surface,
  inversePrimary: palette.surface,
  surfaceDisabled: "rgba(63, 36, 21, 0.12)",
  scrim: "#000000",
  shadow: "#000000",
  elevation: lightElevation,
  backdrop: "rgba(63, 36, 21, 0.12)",
} as const;

const darkElevation = {
  level0: "transparent",
  level1: "rgba(249, 204, 165, 0.08)",
  level2: "rgba(249, 204, 165, 0.12)",
  level3: "rgba(249, 204, 165, 0.16)",
  level4: "rgba(249, 204, 165, 0.2)",
  level5: "rgba(249, 204, 165, 0.24)",
} as const;

const darkOverrides = {
  background: "#181312",
  surface: "#221C1A",
  surfaceBright: "rgba(47, 29, 19, 0.92)",
  surfaceVariant: "rgba(166, 216, 170, 0.12)",
  surfaceTint: palette.primary,
  primary: palette.primary,
  onPrimary: "#EAFBEA",
  primaryContainer: "#2E5E2D",
  onPrimaryContainer: "#CFF4D2",
  secondary: palette.primary,
  onSecondary: "#EAFBEA",
  secondaryContainer: "#2E5E2D",
  onSecondaryContainer: "#CFF4D2",
  tertiary: "#3C2315",
  onTertiary: palette.surface,
  tertiaryContainer: "#52311D",
  onTertiaryContainer: palette.surface,
  outline: "rgba(166, 216, 170, 0.4)",
  outlineVariant: "rgba(166, 216, 170, 0.24)",
  onSurface: palette.surface,
  onSurfaceVariant: "rgba(166, 216, 170, 0.7)",
  onSurfaceDisabled: "rgba(166, 216, 170, 0.38)",
  onBackground: palette.surface,
  inverseSurface: palette.surface,
  inverseOnSurface: palette.ink,
  inversePrimary: palette.surface,
  surfaceDisabled: "rgba(166, 216, 170, 0.12)",
  scrim: "#000000",
  shadow: "#000000",
  elevation: darkElevation,
  backdrop: "rgba(166, 216, 170, 0.18)",
} as const;

export const paperLightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightOverrides,
    ...palette,
    background: lightOverrides.background,
  },
};

export const paperDarkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkOverrides,
    ...palette,
    background: darkOverrides.background,
  },
};

const { LightTheme: navigationLightBase, DarkTheme: navigationDarkBase } =
  adaptNavigationTheme({
    reactNavigationLight: DefaultTheme,
    reactNavigationDark: DarkTheme,
  });

export const navigationLightTheme: Theme = {
  ...navigationLightBase,
  colors: {
    ...navigationLightBase.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.ink,
    primary: palette.primary,
    border: palette.inkMuted,
    notification: palette.primary,
  },
};

export const navigationDarkTheme: Theme = {
  ...navigationDarkBase,
  colors: {
    ...navigationDarkBase.colors,
    background: darkOverrides.background,
    card: darkOverrides.surface,
    text: palette.surface,
    primary: palette.primary,
    border: darkOverrides.outline,
    notification: palette.primary,
  },
};
