import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Screen } from "@/src/components/Screen";
import { BrandLogo } from "@/src/components/ui/BrandLogo";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async () => {
    if (!isLoaded || !email.trim()) return;

    setError(null);
    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      router.push({
        pathname: "/(auth)/reset-password",
        params: { email: email.trim() },
      });
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code: string; message: string }[] };
      const code = clerkErr?.errors?.[0]?.code ?? "";
      if (code === "form_identifier_not_found") {
        setError("Nie znaleziono konta z tym adresem e-mail.");
      } else if (code === "form_param_format_invalid") {
        setError("Podaj prawidłowy adres e-mail.");
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
        title="Resetuj hasło"
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
              Podaj adres e-mail, a wyślemy Ci link do zresetowania hasła.
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label="Adres e-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            error={!!error}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={isLoading}
            disabled={isLoading || !email.trim()}
            style={styles.submitButton}
          >
            Wyślij kod resetujący
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
