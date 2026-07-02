import { cardShadow, radius, spacing } from "@/src/theme/ui";
import { PropsWithChildren, useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from "react-native";
import { Icon, MD3Theme, Surface, Text, useTheme } from "react-native-paper";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Props = PropsWithChildren<{
  title: string;
  defaultExpanded?: boolean;
}>;

export function ExpandableCard({ title, children, defaultExpanded = false }: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <Surface style={styles.card} elevation={0}>
      <Pressable style={styles.header} onPress={toggle} hitSlop={4}>
        <Text style={styles.title}>{title}</Text>
        <Icon
          source={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </Surface>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
      gap: spacing.sm,
      ...cardShadow,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
      flex: 1,
    },
    content: {
      gap: spacing.sm,
    },
  });
