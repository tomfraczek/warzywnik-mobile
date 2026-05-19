import { useGetNotificationsSummary } from "@/src/api/queries/notifications/useGetNotificationsSummary";
import { NotificationPriority } from "@/src/features/push/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type NotificationsBellButtonProps = {
  size?: number;
  iconSize?: number;
  iconColor: string;
  borderColor: string;
  backgroundColor: string;
  pressedBackgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  animateOnRouteChange?: boolean;
};

const getNotificationsDotColor = (priority: NotificationPriority | null) => {
  if (priority === "CRITICAL") return "#D32F2F";
  if (priority === "HIGH") return "#E07A00";
  return "#2E7D32";
};

export function NotificationsBellButton({
  size = 40,
  iconSize = 22,
  iconColor,
  borderColor,
  backgroundColor,
  pressedBackgroundColor,
  style,
  disabled,
  accessibilityLabel = "Powiadomienia",
  animateOnRouteChange = true,
}: NotificationsBellButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const summaryQuery = useGetNotificationsSummary();
  const hasUnread = summaryQuery.data?.hasUnread === true;
  const unreadCount = summaryQuery.data?.unreadCount ?? 0;
  const dotColor = getNotificationsDotColor(
    summaryQuery.data?.highestUnreadPriority ?? null,
  );
  const rotation = useSharedValue(0);
  const previousUnreadCountRef = useRef<number>(unreadCount);
  const hasInitializedUnreadRef = useRef(false);

  const ringBell = useCallback(() => {
    cancelAnimation(rotation);
    rotation.value = withSequence(
      withTiming(-16, {
        duration: 70,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(16, {
        duration: 100,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(-10, {
        duration: 90,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(10, {
        duration: 90,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(0, {
        duration: 90,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [rotation]);

  useEffect(() => {
    if (!animateOnRouteChange || disabled) return;
    if (!hasUnread) return;
    ringBell();
  }, [animateOnRouteChange, disabled, hasUnread, pathname, ringBell]);

  useEffect(() => {
    if (disabled) return;

    const previousUnreadCount = previousUnreadCountRef.current;
    const hasUnreadIncreased = unreadCount > previousUnreadCount;

    previousUnreadCountRef.current = unreadCount;

    if (!hasInitializedUnreadRef.current) {
      hasInitializedUnreadRef.current = true;
      return;
    }

    if (hasUnreadIncreased) {
      ringBell();
    }
  }, [disabled, ringBell, unreadCount]);

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={() => router.push("/notifications")}
      hitSlop={8}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          backgroundColor:
            pressed && pressedBackgroundColor
              ? pressedBackgroundColor
              : backgroundColor,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <Animated.View style={bellAnimatedStyle}>
        <MaterialCommunityIcons
          name="bell-outline"
          size={iconSize}
          color={iconColor}
        />
      </Animated.View>
      {hasUnread ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
