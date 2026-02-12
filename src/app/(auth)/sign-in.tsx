import { Screen } from "@/src/components/Screen";
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

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
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        // Sprawdź czy mamy obiekt signIn czy signUp
        if (signIn) {
          // Obsłuż dalsze kroki logowania
          if (signIn.status === "needs_second_factor") {
            // Przekieruj do ekranu MFA
            // router.push("/mfa");
          } else if (signIn.status === "needs_identifier") {
            // Może potrzebować dodatkowych informacji
            console.log("Potrzebne dodatkowe informacje");
          }
        }

        if (signUp) {
          // Obsłuż dalsze kroki rejestracji
          if (signUp.status === "missing_requirements") {
            // Może potrzebować weryfikacji email/telefonu
            console.log("Brakujące wymagania rejestracji");
          }
        }
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Screen>
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
