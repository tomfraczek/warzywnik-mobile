import { setAuthTokenProvider } from "@/src/api/axios";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";

export const useClerkToken = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthTokenProvider(async () => null);
      return;
    }

    setAuthTokenProvider(async () => (await getToken()) ?? null);
  }, [isSignedIn, getToken]);
};
