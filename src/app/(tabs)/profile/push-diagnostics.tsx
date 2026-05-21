import { restClient } from "@/src/api/axios";
import { useGetNotificationPreferences } from "@/src/api/queries/notifications/useGetNotificationPreferences";
import { useMe } from "@/src/api/queries/users/useUpdateMe";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import {
  getPushDiagnosticsState,
  isPushDiagnosticsVisible,
  subscribePushDiagnosticsState,
  updatePushDiagnosticsState,
} from "@/src/features/push/diagnostics";
import {
  clearStoredPushRegistration,
  getExpoToken,
  registerDevice,
  requestPermission,
} from "@/src/features/push/push";
import { Redirect } from "expo-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  MD3Theme,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const asJson = (value: unknown) => {
  if (value === null || value === undefined) return "-";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const buildDiagnosticsText = (
  appPushEnabled: boolean,
  diagnostics: ReturnType<typeof getPushDiagnosticsState>,
) => {
  return [
    `Push enabled in app: ${String(appPushEnabled)}`,
    `System permission granted: ${String(diagnostics.systemPermissionGranted)}`,
    `Expo push token: ${diagnostics.expoPushToken ?? ""}`,
    `Backend registration status: ${diagnostics.backendRegistrationStatus}`,
    `Platform: ${diagnostics.platform}`,
    `App version: ${diagnostics.appVersion}`,
    `Build version: ${diagnostics.buildVersion}`,
    `Runtime version: ${diagnostics.runtimeVersion}`,
    `EAS channel: ${diagnostics.easChannel}`,
    `App ownership: ${diagnostics.appOwnership}`,
    `Execution environment: ${diagnostics.executionEnvironment}`,
    `Is physical device: ${String(diagnostics.isPhysicalDevice)}`,
    `Last registerDevice payload: ${asJson(diagnostics.lastRegisterDevicePayload)}`,
    `Last registerDevice response: ${asJson(diagnostics.lastRegisterDeviceResponse)}`,
    `Last registerDevice error: ${diagnostics.lastRegisterDeviceError ?? ""}`,
    `Last disableDevice response: ${asJson(diagnostics.lastDisableDeviceResponse)}`,
    `Last disableDevice error: ${diagnostics.lastDisableDeviceError ?? ""}`,
    `Last getPermissionsAsync result: ${asJson(diagnostics.lastGetPermissionsResult)}`,
    `Last requestPermissionsAsync result: ${asJson(diagnostics.lastRequestPermissionsResult)}`,
    `Last notification received timestamp: ${diagnostics.lastNotificationReceivedAt ?? ""}`,
    `Last notification opened timestamp: ${diagnostics.lastNotificationOpenedAt ?? ""}`,
  ].join("\n");
};

const copyTextToClipboard = async (value: string) => {
  try {
    const clipboard = await import("expo-clipboard");
    if (typeof clipboard.setStringAsync === "function") {
      await clipboard.setStringAsync(value);
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export default function PushDiagnosticsScreen() {
  const isVisible = isPushDiagnosticsVisible();

  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const preferencesQuery = useGetNotificationPreferences();
  const meQuery = useMe();
  const appPushEnabled = preferencesQuery.data?.notificationsEnabled ?? false;
  const diagnostics = useSyncExternalStore(
    subscribePushDiagnosticsState,
    getPushDiagnosticsState,
    getPushDiagnosticsState,
  );
  const [isReRegistering, setIsReRegistering] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [testPushTitle, setTestPushTitle] = useState("Push test - Warzywnik");
  const [testPushBody, setTestPushBody] = useState(
    "To jest testowe powiadomienie z panelu diagnostycznego.",
  );

  const diagnosticsText = useMemo(
    () => buildDiagnosticsText(appPushEnabled, diagnostics),
    [appPushEnabled, diagnostics],
  );

  if (!isVisible) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const copyDiagnostics = async () => {
    const copied = await copyTextToClipboard(diagnosticsText);
    if (!copied) {
      Alert.alert(
        "Push diagnostics",
        "Kopiowanie niedostępne w tym buildzie (brak ExpoClipboard).",
      );
      return;
    }
    Alert.alert("Push diagnostics", "Skopiowano dane diagnostyczne.");
  };

  const reRegisterDevice = async () => {
    if (isReRegistering) return;
    setIsReRegistering(true);

    try {
      await clearStoredPushRegistration();
      const permission = await requestPermission();

      if (!permission.granted) {
        updatePushDiagnosticsState({
          backendRegistrationStatus: "skipped",
          systemPermissionGranted: false,
        });
        Alert.alert(
          "Push diagnostics",
          "Brak zgody systemowej na powiadomienia. Włącz ją w ustawieniach telefonu.",
        );
        return;
      }

      const token = await getExpoToken();
      if (!token) {
        throw new Error("Expo push token is empty");
      }

      await registerDevice({
        expoPushToken: token,
        platform: Platform.OS,
      });

      Alert.alert("Push diagnostics", "Ponownie zarejestrowano urządzenie.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nieznany błąd rejestracji";
      updatePushDiagnosticsState({
        backendRegistrationStatus: "error",
        lastRegisterDeviceError: message,
      });
      Alert.alert(
        "Push diagnostics",
        `Rejestracja nie powiodła się: ${message}`,
      );
    } finally {
      setIsReRegistering(false);
    }
  };

  const sendTestPush = async () => {
    if (isSendingTestPush) return;
    setIsSendingTestPush(true);

    try {
      const resolvedUserId =
        typeof meQuery.data?.id === "string" ? meQuery.data.id.trim() : "";
      const resolvedTitle = testPushTitle.trim();
      const resolvedBody = testPushBody.trim();

      if (!resolvedUserId) {
        Alert.alert(
          "Push diagnostics",
          "Brak UUID użytkownika z /me. Odśwież ekran lub zaloguj się ponownie.",
        );
        return;
      }

      if (resolvedTitle.length < 1 || resolvedTitle.length > 180) {
        Alert.alert("Push diagnostics", "Tytuł musi mieć od 1 do 180 znaków.");
        return;
      }

      if (resolvedBody.length < 1 || resolvedBody.length > 1000) {
        Alert.alert("Push diagnostics", "Treść musi mieć od 1 do 1000 znaków.");
        return;
      }

      await restClient.post("/debug/push-test", {
        userId: resolvedUserId,
        title: resolvedTitle,
        body: resolvedBody,
      });

      Alert.alert("Push diagnostics", "Wysłano żądanie test push.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nieznany błąd test push";
      Alert.alert("Push diagnostics", `Test push nie powiódł się: ${message}`);
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card title="Push diagnostics">
          <View style={styles.row}>
            <Text style={styles.label}>Push enabled in app</Text>
            <Text>{String(appPushEnabled)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>System permission granted</Text>
            <Text>{String(diagnostics.systemPermissionGranted)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expo push token</Text>
            <Text selectable style={styles.valueText}>
              {diagnostics.expoPushToken ?? "-"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Backend registration status</Text>
            <Text>{diagnostics.backendRegistrationStatus}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform</Text>
            <Text>{diagnostics.platform}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>App version</Text>
            <Text>{diagnostics.appVersion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Build version</Text>
            <Text>{diagnostics.buildVersion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Runtime version</Text>
            <Text>{diagnostics.runtimeVersion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>EAS channel</Text>
            <Text>{diagnostics.easChannel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last registerDevice response</Text>
            <Text selectable style={styles.valueText}>
              {asJson(diagnostics.lastRegisterDeviceResponse)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last notification received</Text>
            <Text>{diagnostics.lastNotificationReceivedAt ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last notification opened</Text>
            <Text>{diagnostics.lastNotificationOpenedAt ?? "-"}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Test push title</Text>
          <TextInput
            mode="outlined"
            value={testPushTitle}
            onChangeText={setTestPushTitle}
            maxLength={180}
          />

          <Text style={styles.label}>Test push body</Text>
          <TextInput
            mode="outlined"
            value={testPushBody}
            onChangeText={setTestPushBody}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />

          <Button mode="contained" onPress={() => void copyDiagnostics()}>
            Skopiuj dane diagnostyczne
          </Button>
          <Button
            mode="outlined"
            onPress={() => void reRegisterDevice()}
            loading={isReRegistering}
            disabled={isReRegistering}
          >
            Ponownie zarejestruj urządzenie
          </Button>
          <Button
            mode="outlined"
            onPress={() => void sendTestPush()}
            loading={isSendingTestPush}
            disabled={isSendingTestPush}
          >
            Wyślij test push
          </Button>
        </Card>

        <Card title="Raw diagnostics JSON">
          <Text selectable style={styles.jsonText}>
            {diagnosticsText}
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      gap: 12,
      paddingBottom: 24,
    },
    row: {
      gap: 4,
      marginBottom: 10,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    valueText: {
      fontSize: 12,
    },
    jsonText: {
      fontSize: 12,
      fontFamily: Platform.select({
        ios: "Menlo",
        android: "monospace",
        default: "monospace",
      }),
    },
  });
