import { Pressable, StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

type ListRowProps = {
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, onPress }: ListRowProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },
    textWrap: {
      gap: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
