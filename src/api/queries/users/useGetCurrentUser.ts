import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";

export type PublicUser = {
  id: string;
  clerkUserId: string;
  isAdmin: boolean;
  status: "active" | "blocked";
  createdAt: string;
  updatedAt: string;
  settings?: {
    unitLength: "cm" | "inch";
    unitArea: "m2" | "ft2";
    locale: "pl" | "en";
    darkMode: boolean;
    updatedAt: string;
  };
};

const getCurrentUser = async (): Promise<PublicUser | null> => {
  const { data } = await restClient.get("/users/me");
  return data ?? null;
};

export const useGetCurrentUser = (enabled = true) =>
  useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled,
  });
