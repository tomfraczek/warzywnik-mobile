import { useFonts } from "expo-font";
import { Image, StyleSheet, View } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";

type BrandLogoProps = {
  logoSize?: number;
  wrapperWidth?: number;
  wrapperHeight?: number;
  brandSize?: number;
};

export function BrandLogo({
  logoSize = 140,
  wrapperWidth = 190,
  wrapperHeight = 140,
  brandSize = 30,
}: BrandLogoProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme, {
    logoSize,
    wrapperWidth,
    wrapperHeight,
    brandSize,
  });
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../../../assets/fonts/SpaceMono-Regular.ttf"),
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image
          source={require("../../../assets/images/logo_no_bg.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.brand, fontsLoaded ? styles.brandLoaded : null]}>
        WARZYWNIK
      </Text>
    </View>
  );
}

type StyleOptions = Required<BrandLogoProps>;

function makeStyles(theme: MD3Theme, options: StyleOptions) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      gap: 12,
    },
    logoWrapper: {
      width: options.wrapperWidth,
      height: options.wrapperHeight,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: options.logoSize,
      height: options.logoSize,
    },
    brand: {
      fontSize: options.brandSize,
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
}
