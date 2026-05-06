import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import {
  ActivityIndicator,
  Icon,
  MD3Theme,
  useTheme,
} from "react-native-paper";

type PrimaryActionButtonProps = {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryActionButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  color,
  style,
}: PrimaryActionButtonProps) {
  const theme = useTheme<MD3Theme>();
  const resolvedColor = color ?? theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: resolvedColor,
          backgroundColor: resolvedColor,
          opacity: disabled ? 0.7 : pressed ? 0.92 : 1,
        },
        style,
      ]}
      disabled={disabled}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size={20} color="#FFFFFF" />
        ) : (
          <Icon source={icon} size={22} color="#FFFFFF" />
        )}
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
