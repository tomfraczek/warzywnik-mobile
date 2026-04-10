import { Screen } from "@/src/components/Screen";
import { useFonts } from "expo-font";
import { Image, StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

export const AuthFlowLoader = () => {
  const theme = useTheme<MD3Theme>();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const styles = makeStyles(theme);

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/images/logo_no_bg.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brand, fontsLoaded ? styles.brandLoaded : null]}>
            WARZYWNIK
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      borderRadius: 20,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: "center",
      // backgroundColor: theme.colors.surfaceVariant,
      gap: 12,
    },
    logoWrapper: {
      width: 190,
      height: 140,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: 140,
      height: 140,
    },
    brand: {
      fontSize: 30,
      letterSpacing: 6,
      color: theme.colors.primary,
      textAlign: "center",
      fontWeight: "700",
      textShadowColor: `${theme.colors.primary}22`,
      textShadowOffset: { width: 0, height: 6 },
      textShadowRadius: 14,
    },
    brandLoaded: {
      fontFamily: "SpaceMono",
      fontWeight: "400",
    },
  });
