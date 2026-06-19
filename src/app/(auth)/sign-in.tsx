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
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import React from "react";
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

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const redirectUrl = AuthSession.makeRedirectUri({
    scheme: "warzywnikmobile",
    path: "oauth-native-callback",
  });

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = React.useState(
    isSsoAuthInProgress(),
  );

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setLoginError(null);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code: string }[] };
      const code = clerkErr?.errors?.[0]?.code ?? "";
      if (
        code === "form_password_incorrect" ||
        code === "form_param_format_invalid" ||
        code === "form_identifier_not_found" ||
        code === "session_exists"
      ) {
        setLoginError("Nieprawidłowy adres e-mail lub hasło.");
      } else {
        setLoginError("Wystąpił błąd. Spróbuj ponownie.");
      }
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onGoogleSignInPress = async () => {
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
            "To konto wymaga dodatkowych informacji. Spróbuj ponownie lub załóż konto.",
          );
          router.replace("/(auth)");
          return;
        }
        if (signInStatus === "needs_second_factor") {
          Alert.alert(
            "Wymagany drugi składnik",
            "Dokończ logowanie z użyciem dodatkowej weryfikacji.",
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

  if (isGoogleAuthLoading) {
    return <AuthFlowLoader />;
  }

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]}>
      <CustomHeader
        showBack
        hideBell
        onBackPress={() => router.replace("/(auth)")}
        title="Zaloguj się"
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
            <Text style={styles.subtitle}>Miło Cię widzieć z powrotem!</Text>
          </View>

          <GoogleButton onPress={onGoogleSignInPress} />

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
            error={!!loginError}
            onChangeText={(v) => {
              setEmailAddress(v);
              setLoginError(null);
            }}
          />
          <TextInput
            mode="outlined"
            label="Hasło"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={(v) => {
              setPassword(v);
              setLoginError(null);
            }}
            error={!!loginError}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />
          {loginError ? (
            <Text style={styles.errorText}>{loginError}</Text>
          ) : null}
          <Button
            mode="contained"
            onPress={onSignInPress}
            style={styles.submitButton}
          >
            Zaloguj się
          </Button>

          <Link href="../forgot-password" style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Zapomniałem hasła</Text>
          </Link>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Nie masz konta?</Text>
            <Link href="../sign-up">
              <Text style={styles.link}>Zarejestruj się</Text>
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
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      marginTop: -8,
    },
    forgotLink: {
      alignSelf: "center",
      marginTop: -4,
    },
    forgotLinkText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "500",
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
