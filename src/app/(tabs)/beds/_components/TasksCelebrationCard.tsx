import { StyleSheet, Text, View } from "react-native";
import { Icon, MD3Theme, useTheme } from "react-native-paper";

const buildPalette = (dark: boolean) => ({
  accent: dark ? "#7AB88A" : "#4A7C59",
  secondary: dark ? "#9AA59E" : "#6E7972",
  heroTagText: dark ? "#9ECFA9" : "#4F7459",
  accentBg: dark ? "#1A2E1F" : "#EBF5EE",
  accentBorder: dark ? "#2A4A32" : "#C5DFC9",
});

type TasksCelebrationCardProps = {
  title?: string;
};

export function TasksCelebrationCard({
  title = "Jesteś na bieżąco",
}: TasksCelebrationCardProps) {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(palette);

  return (
    <View style={styles.card}>
      <View style={styles.confettiLayer}>
        <View style={styles.confettiA}>
          <Icon source="party-popper" size={18} color={palette.accent} />
        </View>
        <View style={styles.confettiB}>
          <Icon source="party-popper" size={14} color={palette.heroTagText} />
        </View>
        <View style={styles.confettiC}>
          <Icon source="star-four-points" size={14} color={palette.accent} />
        </View>
        <View style={styles.confettiD}>
          <Icon source="star-four-points" size={12} color={palette.secondary} />
        </View>
      </View>
      <View style={styles.content}>
        <Icon source="party-popper" size={22} color={palette.accent} />
        <Text style={styles.text}>{title}</Text>
      </View>
    </View>
  );
}

const makeStyles = (palette: ReturnType<typeof buildPalette>) =>
  StyleSheet.create({
    card: {
      position: "relative",
      borderWidth: 1,
      borderColor: palette.accentBorder,
      backgroundColor: palette.accentBg,
      borderRadius: 14,
      overflow: "hidden",
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    confettiLayer: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.45,
    },
    confettiA: {
      position: "absolute",
      top: 8,
      left: 10,
    },
    confettiB: {
      position: "absolute",
      top: 6,
      right: 12,
    },
    confettiC: {
      position: "absolute",
      bottom: 8,
      left: 26,
    },
    confettiD: {
      position: "absolute",
      bottom: 10,
      right: 30,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    text: {
      fontSize: 15,
      fontWeight: "700",
      color: palette.accent,
    },
  });
