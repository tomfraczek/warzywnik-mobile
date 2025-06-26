import { useQuery } from "@tanstack/react-query";
import { restClient } from "../axios";

export const getUsers = async () => {
  const response = await restClient.get("/users");
  return response.data;
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
};
