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

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={safeAreaEdges ?? ["top", "bottom", "left", "right"]}
    >
      <Surface style={[styles.surface, style]}>{children}</Surface>
    </SafeAreaView>
  );
};
