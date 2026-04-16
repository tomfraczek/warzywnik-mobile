import { OFFLINE_BANNER_EXTRA_HEIGHT } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { MD3Theme, Surface, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  safeAreaEdges?: SafeAreaViewProps["edges"];
}>;

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    surface: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export const Screen = ({ children, style, safeAreaEdges }: ScreenProps) => {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const isOffline = useIsOffline();

  const edges = safeAreaEdges ?? ["top", "bottom", "left", "right"];
  // Only add extra padding when this screen owns its top safe area ("top" in
  // edges). SafeAreaView already handles insets.top itself — we just need the
  // extra height the banner adds BEYOND the status bar (paddingBottom + text).
  // IMPORTANT: paddingTop must go on Surface, NOT on SafeAreaView, because
  // SafeAreaView merges styles as [insetStyle, userStyle], meaning any
  // paddingTop in userStyle would OVERRIDE (not add to) the insets.top.
  const hasTopEdge = (edges as string[]).includes("top");
  const surfaceExtraPaddingTop =
    isOffline && hasTopEdge ? OFFLINE_BANNER_EXTRA_HEIGHT : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <Surface
        elevation={0}
        style={[
          styles.surface,
          style,
          surfaceExtraPaddingTop > 0
            ? { paddingTop: surfaceExtraPaddingTop }
            : null,
        ]}
      >
        {children}
      </Surface>
    </SafeAreaView>
  );
};
