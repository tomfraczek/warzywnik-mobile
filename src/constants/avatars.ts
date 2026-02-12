import { ImageSourcePropType } from "react-native";

export type AvatarId = "bear" | "fox" | "frog" | "hadgehog" | "owl" | "rabit";

type AvatarDefinition = {
  id: AvatarId;
  source: ImageSourcePropType;
};

export const AVATARS: AvatarDefinition[] = [
  { id: "bear", source: require("../assets/avatars/bear.png") },
  { id: "fox", source: require("../assets/avatars/fox.png") },
  { id: "frog", source: require("../assets/avatars/frog.png") },
  { id: "hadgehog", source: require("../assets/avatars/hadgehog.png") },
  { id: "owl", source: require("../assets/avatars/owl.png") },
  { id: "rabit", source: require("../assets/avatars/rabit.png") },
];

export const getAvatarSource = (avatarId?: AvatarId | null) =>
  AVATARS.find((avatar) => avatar.id === avatarId)?.source;
