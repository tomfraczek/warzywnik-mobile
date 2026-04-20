import { FavoriteTargetType } from "@/src/api/queries/favorites/types";
import { useFavoriteToggle } from "@/src/api/queries/favorites/useFavoriteToggle";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

type Props = {
  targetType: FavoriteTargetType;
  targetSlug: string | null | undefined;
  /** "overlay" = absolute over image with dark circle bg (list cards)
   *  "bare"    = absolute, no background, gray/red icon (detail screens)
   *  "inline"  = for row cards, no absolute positioning */
  variant?: "overlay" | "bare" | "inline";
  size?: number;
  /** Color for inactive heart in "inline" variant */
  inactiveColor?: string;
};

/**
 * Heart button for cards. Absolutely positioned – place inside a `position: relative` container.
 * Shows an outline heart when not favorited, filled red heart when favorited.
 */
export function FavoriteButton({
  targetType,
  targetSlug,
  variant = "overlay",
  size = 22,
  inactiveColor = "#C0CAC4",
}: Props) {
  const { isFavorited, toggle, isBusy, isAvailable } = useFavoriteToggle(
    targetType,
    targetSlug,
  );

  if (!isAvailable) return null;

  if (variant === "inline") {
    return (
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          toggle();
        }}
        disabled={isBusy}
        hitSlop={8}
        android_ripple={null}
        style={{ opacity: isBusy ? 0.6 : 1 }}
      >
        <Icon
          source={isFavorited ? "heart" : "heart-outline"}
          size={size}
          color={isFavorited ? "#E05252" : inactiveColor}
        />
      </Pressable>
    );
  }

  if (variant === "bare") {
    return (
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          toggle();
        }}
        disabled={isBusy}
        hitSlop={10}
        android_ripple={null}
        style={[styles.btn, { opacity: isBusy ? 0.6 : 1 }]}
      >
        <Icon
          source={isFavorited ? "heart" : "heart-outline"}
          size={size}
          color={isFavorited ? "#E05252" : "#B0BAB5"}
        />
      </Pressable>
    );
  }

  // overlay — dark circle bg (for list card images)
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        toggle();
      }}
      disabled={isBusy}
      hitSlop={8}
      android_ripple={null}
      style={[styles.btn, { opacity: isBusy ? 0.6 : 1 }]}
    >
      <View style={styles.shadow}>
        <Icon
          source={isFavorited ? "heart" : "heart-outline"}
          size={size}
          color={isFavorited ? "#E05252" : "#FFFFFF"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  shadow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
});
