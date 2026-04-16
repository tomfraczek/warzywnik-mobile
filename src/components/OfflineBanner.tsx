import { OFFLINE_BANNER_TEXT } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { StyleSheet, Text, View } from "react-native";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <Portal>
      <View
        pointerEvents="none"
        style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}
      >
        <Text style={styles.text}>{OFFLINE_BANNER_TEXT}</Text>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: "#000000",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
