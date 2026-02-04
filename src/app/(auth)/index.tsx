import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Warzywnik</Text>
      <Text style={styles.subtitle}>
        Zacznij od zalogowania lub rejestracji
      </Text>

      <View style={styles.actions}>
        <Link href="/sign-in" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Zaloguj się</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/sign-up" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Zarejestruj się</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 32,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: "#3b82f6",
    textAlign: "center",
    fontWeight: "600",
  },
});
