import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type PrimaryScreenHeadingProps = {
  title: string;
  subtitle: string;
};

export function PrimaryScreenHeading({
  title,
  subtitle,
}: PrimaryScreenHeadingProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      gap: 4,
      marginBottom: 18,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.4,
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
    },
  });
