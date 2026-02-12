import { StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";

type EmptyStateProps = {
  title: string;
  subtitle?: string | null;
  actionLabel?: string | null;
  onAction?: () => void;
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button mode="outlined" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 24,
      alignItems: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 6,
    },
    button: {
      marginTop: 12,
    },
  });
