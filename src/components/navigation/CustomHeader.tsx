import { OFFLINE_BANNER_EXTRA_HEIGHT } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useRouter, useSegments } from "expo-router";
import { ReactNode, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, MD3Theme, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomHeaderProps = {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  overlay?: boolean;
  variant?: "default" | "overlay";
  backRoute?:
    | "/(tabs)/home"
    | "/(tabs)/beds"
    | "/(tabs)/planner"
    | "/(tabs)/education"
    | "/(tabs)/profile";
  actions?: HeaderAction[];
  rightAction?: ReactNode;
};

export type HeaderAction = {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  hidden?: boolean;
  accessibilityLabel?: string;
};

export default function CustomHeader({
  title,
  showBack,
  onBackPress,
  overlay,
  variant = "default",
  backRoute,
  actions,
  rightAction,
}: CustomHeaderProps) {
  const theme = useTheme<MD3Theme>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const isOffline = useIsOffline();

  type TabRootRoute =
    | "/(tabs)/home"
    | "/(tabs)/beds"
    | "/(tabs)/planner"
    | "/(tabs)/education"
    | "/(tabs)/profile";

  const tabSegment = segments[0] === "(tabs)" ? segments[1] : null;
  const fallbackRoute: TabRootRoute =
    tabSegment === "beds"
      ? "/(tabs)/beds"
      : tabSegment === "planner"
        ? "/(tabs)/planner"
        : tabSegment === "education"
          ? "/(tabs)/education"
          : tabSegment === "profile"
            ? "/(tabs)/profile"
            : "/(tabs)/home";

  const handleBack = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (backRoute) {
      router.replace(backRoute);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  }, [backRoute, fallbackRoute, onBackPress, router]);

  const shouldShowBack = showBack ?? router.canGoBack();
  const visibleActions = (actions ?? []).filter((action) => !action.hidden);
  const isOverlay = overlay ?? variant === "overlay";
  const actionIconColor = isOverlay ? "#FFFFFF" : theme.colors.onSurface;
  const dark = theme.dark;

  return (
    <View
      style={[
        isOverlay ? styles.overlayContainer : styles.container,
        {
          paddingTop:
            insets.top + (isOffline ? OFFLINE_BANNER_EXTRA_HEIGHT : 0) + 8,
          backgroundColor: dark ? "#141816" : "#F7F8F5",
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftGroup}>
          {shouldShowBack ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.circleAction,
                {
                  borderColor: isOverlay
                    ? "rgba(255,255,255,0.28)"
                    : theme.colors.outline,
                  backgroundColor: isOverlay
                    ? pressed
                      ? "rgba(17, 24, 20, 0.72)"
                      : "rgba(17, 24, 20, 0.52)"
                    : pressed
                      ? theme.colors.surfaceVariant
                      : theme.colors.surface,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Wróć"
            >
              <Icon source="arrow-left" size={22} color={actionIconColor} />
            </Pressable>
          ) : (
            <View style={styles.placeholderAction} />
          )}
          {title ? (
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                { color: isOverlay ? "#FFFFFF" : theme.colors.onSurface },
              ]}
            >
              {title}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightGroup}>
          {visibleActions.map((action, index) => (
            <Pressable
              key={`${action.icon}-${index}`}
              onPress={action.onPress}
              disabled={action.disabled}
              style={({ pressed }) => [
                styles.circleAction,
                {
                  borderColor: isOverlay
                    ? "rgba(255,255,255,0.28)"
                    : theme.colors.outline,
                  backgroundColor: isOverlay
                    ? pressed
                      ? "rgba(17, 24, 20, 0.72)"
                      : "rgba(17, 24, 20, 0.52)"
                    : pressed
                      ? theme.colors.surfaceVariant
                      : theme.colors.surface,
                  opacity: action.disabled ? 0.55 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
            >
              <Icon source={action.icon} size={20} color={actionIconColor} />
            </Pressable>
          ))}
          {rightAction ? (
            <View style={styles.rightAction}>{rightAction}</View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  container: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  leftGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  rightGroup: {
    minWidth: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  circleAction: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderAction: {
    width: 42,
    height: 42,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "left",
  },
  rightAction: {
    marginRight: 2,
  },
});
