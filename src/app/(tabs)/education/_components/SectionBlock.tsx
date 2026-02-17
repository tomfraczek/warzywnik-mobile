import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

type SectionBlockProps = {
  title: string;
  text?: string | null;
  items?: string[] | string | null;
};

const normalizeItems = (items?: string[] | string | null) => {
  if (!items) return [];
  if (Array.isArray(items)) return items.filter(Boolean);
  return items
    .split(/\r?\n|•|\u2022|\-/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

export function SectionBlock({ title, text, items }: SectionBlockProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const resolvedItems = normalizeItems(items);

  if (!text && resolvedItems.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {resolvedItems.length > 0 ? (
        <View style={styles.list}>
          {resolvedItems.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    text: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    list: {
      marginTop: 6,
      gap: 4,
    },
    listItem: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
