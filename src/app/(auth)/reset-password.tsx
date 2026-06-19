import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Screen } from "@/src/components/Screen";
import { BrandLogo } from "@/src/components/ui/BrandLogo";
import { useSignIn } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";

export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async () => {
    if (!isLoaded || !code.trim() || !password) return;

    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError("Nie udało się zresetować hasła. Spróbuj ponownie.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code: string; message: string }[] };
      const errCode = clerkErr?.errors?.[0]?.code ?? "";
      if (errCode === "form_code_incorrect") {
        setError("Nieprawidłowy kod. Sprawdź wiadomość e-mail i spróbuj ponownie.");
      } else if (errCode === "form_password_pwned" || errCode === "form_password_length_too_short") {
        setError("Hasło jest zbyt słabe. Użyj dłuższego lub bardziej złożonego hasła.");
      } else if (errCode === "verification_expired") {
        setError("Kod wygasł. Wróć i wyślij nowy kod.");
      } else {
        setError("Wystąpił błąd. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]}>
      <CustomHeader
        showBack
        hideBell
        onBackPress={() => router.back()}
        title="Nowe hasło"
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
              Wysłaliśmy kod na {email ?? "Twój adres e-mail"}. Wpisz go poniżej i ustaw nowe hasło.
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label="Kod z e-maila"
            keyboardType="number-pad"
            value={code}
            error={!!error}
            onChangeText={(v) => {
              setCode(v);
              setError(null);
            }}
          />
          <TextInput
            mode="outlined"
            label="Nowe hasło"
            value={password}
            secureTextEntry={!showPassword}
            error={!!error}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={isLoading}
            disabled={isLoading || !code.trim() || !password}
            style={styles.submitButton}
          >
            Ustaw nowe hasło
          </Button>
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
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      fontSize: 15,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      marginTop: -8,
    },
    submitButton: {
      marginTop: 4,
    },
  });
