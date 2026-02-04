import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";

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

const bootstrapUser = async (): Promise<PublicUser> => {
  const { data } = await restClient.post("/users/bootstrap");
  return data;
};

export const useBootstrapUser = () =>
  useMutation({
    mutationFn: bootstrapUser,
  });
