import { authorizeAxiosClient } from "@/src/api/axios";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";

export const useClerkToken = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const setToken = async () => {
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          authorizeAxiosClient(token);
        }
      }
    };

    setToken();
  }, [isSignedIn, getToken]);
};
