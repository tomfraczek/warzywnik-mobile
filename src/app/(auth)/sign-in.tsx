import { Screen } from "@/src/components/Screen";
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";

WebBrowser.maybeCompleteAuthSession();

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

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onGoogleSignInPress = async () => {
    if (!isLoaded) return;

    try {
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
        router.replace("/(tabs)/home");
      } else {
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
          return;
        }
        if (signInStatus === "needs_second_factor") {
          Alert.alert(
            "Wymagany drugi składnik",
            "Dokończ logowanie z użyciem dodatkowej weryfikacji.",
          );
          return;
        }
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign in</Text>

        <Button mode="outlined" onPress={onGoogleSignInPress}>
          Continue with Google
        </Button>

        <Text style={styles.orText}>or</Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={setEmailAddress}
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password"
          secureTextEntry
          onChangeText={setPassword}
        />
        <Button mode="contained" onPress={onSignInPress}>
          Continue
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Link href="../sign-up">
            <Text style={styles.link}>Sign up</Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      gap: 12,
    },
    title: {
      fontSize: 24,
      marginBottom: 12,
      textAlign: "center",
      fontWeight: "600",
      color: theme.colors.onBackground,
    },
    input: {
      marginBottom: 4,
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
      textAlign: "center",
      marginVertical: 4,
      color: theme.colors.onSurfaceVariant,
    },
  });
