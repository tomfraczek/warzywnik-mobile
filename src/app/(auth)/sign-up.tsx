import { GoogleButton } from "@/src/app/components/GoogleButton";
import { AuthFlowLoader } from "@/src/components/AuthFlowLoader";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Screen } from "@/src/components/Screen";
import { BrandLogo } from "@/src/components/ui/BrandLogo";
import {
  beginSsoAuth,
  endSsoAuth,
  isSsoAuthInProgress,
} from "@/src/features/push/authFlowState";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  Divider,
  MD3Theme,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const redirectUrl = AuthSession.makeRedirectUri({
    scheme: "warzywnikmobile",
    path: "oauth-native-callback",
  });

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = React.useState(
    isSsoAuthInProgress(),
  );

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onGoogleSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      beginSsoAuth();
      setIsGoogleAuthLoading(true);
      const {
        createdSessionId,
        setActive: setActiveFromSSO,
        signIn: ssoSignIn,
        signUp: ssoSignUp,
      } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (createdSessionId) {
        await (setActiveFromSSO ?? setActive)!({ session: createdSessionId });
        endSsoAuth();
        router.replace("/(tabs)/home");
      } else {
        endSsoAuth();
        setIsGoogleAuthLoading(false);
        const signInStatus = ssoSignIn?.status;
        const signUpStatus = ssoSignUp?.status;
        if (
          signInStatus === "needs_identifier" ||
          signUpStatus === "missing_requirements"
        ) {
          Alert.alert(
            "Dokończ logowanie",
            "To konto wymaga dodatkowych informacji. Spróbuj ponownie.",
          );
          router.replace("/(auth)");
          return;
        }

        Alert.alert(
          "Nie udało się zalogować",
          "Wystąpił problem podczas logowania przez Google. Spróbuj ponownie.",
        );
        router.replace("/(auth)");
      }
    } catch (err) {
      endSsoAuth();
      setIsGoogleAuthLoading(false);
      Alert.alert(
        "Błąd logowania",
        "Logowanie przez Google nie powiodło się. Spróbuj ponownie.",
      );
      router.replace("/(auth)");
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (isGoogleAuthLoading) {
    return (
      <AuthFlowLoader
        title="Logowanie przez Google"
        subtitle="Ładujemy Twoje dane i zaraz przeniesiemy Cię do aplikacji."
      />
    );
  }

  if (pendingVerification) {
    return (
      <Screen safeAreaEdges={["left", "right", "bottom"]}>
        <CustomHeader
          showBack
          hideBell
          onBackPress={() => router.replace("/(auth)")}
          title="Weryfikacja e-mail"
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.subtitle}>
                Wpisz kod weryfikacyjny, który wysłaliśmy na Twój adres e-mail.
              </Text>
            </View>
            <TextInput
              mode="outlined"
              label="Kod weryfikacyjny"
              value={code}
              keyboardType="number-pad"
              onChangeText={(c) => setCode(c)}
            />
            <Button
              mode="contained"
              onPress={onVerifyPress}
              style={styles.submitButton}
            >
              Zweryfikuj
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]}>
      <CustomHeader
        showBack
        hideBell
        onBackPress={() => router.replace("/(auth)")}
        title="Zarejestruj się"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <BrandLogo
              logoSize={56}
              wrapperWidth={76}
              wrapperHeight={56}
              brandSize={16}
            />
            <Text style={styles.subtitle}>
              Dołącz i zacznij prowadzić swój ogród!
            </Text>
          </View>

          <GoogleButton onPress={onGoogleSignUpPress} />

          <View style={styles.dividerRow}>
            <Divider style={styles.divider} />
            <Text style={styles.orText}>lub</Text>
            <Divider style={styles.divider} />
          </View>

          <TextInput
            mode="outlined"
            label="Adres e-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={emailAddress}
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            mode="outlined"
            label="Hasło"
            value={password}
            secureTextEntry={true}
            onChangeText={(p) => setPassword(p)}
          />
          <Button
            mode="contained"
            onPress={onSignUpPress}
            style={styles.submitButton}
          >
            Zarejestruj się
          </Button>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Masz już konto?</Text>
            <Link href="../sign-in">
              <Text style={styles.link}>Zaloguj się</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      gap: 16,
    },
    header: {
      alignItems: "center",
      marginBottom: 8,
      gap: 15,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.colors.onBackground,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    divider: {
      flex: 1,
    },
    submitButton: {
      marginTop: 4,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
      marginTop: 8,
    },
    footerText: {
      color: theme.colors.onSurfaceVariant,
    },
    link: {
      marginLeft: 4,
      color: theme.colors.primary,
      fontWeight: "500",
    },
    orText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
