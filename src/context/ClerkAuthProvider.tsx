// src/contexts/ClerkAuthProvider.tsx
import { authorizeAxiosClient } from "@/src/api/axios";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";

export const ClerkAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [segments] = useSegments(); // np. ['(auth)', 'login']
  const router = useRouter();

  useEffect(() => {
    const secureRoute = async () => {
      if (!isLoaded) return;

      const inAuthGroup = segments[0] === "(auth)";

      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          authorizeAxiosClient(token);
        }

        // Jeśli jesteśmy w auth, ale jesteśmy zalogowani → przekieruj do /home
        if (inAuthGroup) {
          router.replace("/(home)");
        }
      } else {
        // Jeśli NIE jesteśmy w auth i NIE jesteśmy zalogowani → przekieruj do /login
        if (!inAuthGroup) {
          router.replace("/(auth)/sign-in");
        }
      }
    };

    secureRoute();
  }, [isLoaded, isSignedIn, segments, router, getToken]);

  return <>{children}</>;
};
