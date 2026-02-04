import { clientPersister, queryClient } from "@/src/api/queryClient";
import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

const SignOutButton = () => {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
      await clientPersister.removeClient();
      router.replace("/");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign out</Text>
    </TouchableOpacity>
  );
};

export default SignOutButton;
