import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Appbar, MD3Theme, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomHeaderProps = {
  title?: string;
  showBack?: boolean;
  backRoute?: "/(tabs)/home";
};

export default function CustomHeader({
  title,
  showBack,
  backRoute,
}: CustomHeaderProps) {
  const theme = useTheme<MD3Theme>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (backRoute) {
      router.replace(backRoute);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/home");
  }, [backRoute, router]);

  const shouldShowBack = showBack ?? router.canGoBack();

  return (
    <Appbar.Header
      statusBarHeight={insets.top}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
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
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
