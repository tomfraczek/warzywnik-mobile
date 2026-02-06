import { Pressable, StyleSheet, Text, View } from "react-native";

type ListRowProps = {
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, onPress }: ListRowProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  textWrap: {
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
});
