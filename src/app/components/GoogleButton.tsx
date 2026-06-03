import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { Button } from "react-native-paper";

type Props = {
  onPress: () => void;
};

const googleIcon = ({ color, size }: { color: string; size: number }) => (
  <AntDesign name="google" size={size} color={color} />
);

export const GoogleButton = ({ onPress }: Props) => (
  <Button mode="outlined" onPress={onPress} icon={googleIcon}>
    Kontynuuj z Google
  </Button>
);
