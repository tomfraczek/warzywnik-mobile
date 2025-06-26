import { useUsers } from "@/src/api/queries/useUsers";
import { SignOutButton } from "@/src/app/components/SignOutButton";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Page() {
  const { user } = useUser();
  const { data, refetch } = useUsers();
  return (
    <View style={styles.container}>
      <SignedIn>
        <Text style={styles.title}>
          Hello {user?.emailAddresses[0].emailAddress}
        </Text>
        <Button
          title="Fetch users"
          onPress={() => {
            refetch();
            if (data) {
              console.log("Users:", data);
            }
          }}
        />
        <SignOutButton />
      </SignedIn>

      <SignedOut>
        <Text style={styles.title}>Welcome!</Text>
        <View style={styles.buttonContainer}>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Sign in</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SignedOut>
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
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
