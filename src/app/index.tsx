import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <Redirect href={{ pathname: "/(tabs)/home" }} />;
  }

  return <Redirect href={{ pathname: "/(auth)" }} />;
}
