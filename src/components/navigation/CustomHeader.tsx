import { useRouter, useSegments } from "expo-router";
import { ReactNode, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Appbar, MD3Theme, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomHeaderProps = {
  title?: string;
  showBack?: boolean;
  backRoute?:
    | "/(tabs)/home"
    | "/(tabs)/beds"
    | "/(tabs)/planner"
    | "/(tabs)/education"
    | "/(tabs)/profile";
  rightAction?: ReactNode;
};

export default function CustomHeader({
  title,
  showBack,
  backRoute,
  rightAction,
}: CustomHeaderProps) {
  const theme = useTheme<MD3Theme>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();

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
    if (backRoute) {
      router.replace(backRoute);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  }, [backRoute, fallbackRoute, router]);

  const shouldShowBack = showBack ?? router.canGoBack();

  return (
    <Appbar.Header
      statusBarHeight={insets.top}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      {shouldShowBack ? (
        <Appbar.BackAction
          onPress={handleBack}
          iconColor={theme.colors.onSurface}
        />
      ) : null}
      <Appbar.Content
        title={title ?? ""}
        titleStyle={{ color: theme.colors.onSurface }}
      />
      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : null}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  container: {},
  rightAction: {
    marginRight: 4,
  },
});
