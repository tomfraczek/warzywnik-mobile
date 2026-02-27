import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { AvatarId, AVATARS, getAvatarSource } from "@/src/constants/avatars";
import { useSettings } from "@/src/context/SettingsProvider";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  MD3Theme,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function ProfileEditScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const { profile, setProfile } = useSettings();
  const [name, setName] = useState(profile.name);
  const [selectedAvatarId, setSelectedAvatarId] = useState<AvatarId | null>(
    profile.avatarId,
  );

  const selectedAvatarSource = useMemo(
    () => getAvatarSource(selectedAvatarId),
    [selectedAvatarId],
  );

  const handleSave = useCallback(() => {
    setProfile({
      name: name.trim(),
      avatarId: selectedAvatarId,
    });
    router.back();
  }, [name, router, selectedAvatarId, setProfile]);

  return (
    <Screen
      style={styles.container}
      safeAreaEdges={["left", "right", "bottom"]}
    >
      <CustomHeader
        title="Edycja profilu"
        showBack
        rightAction={
          <Button mode="text" compact onPress={handleSave}>
            Zapisz
          </Button>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.previewWrapper}>
            {selectedAvatarSource ? (
              <Avatar.Image
                size={120}
                source={selectedAvatarSource}
                style={styles.previewAvatar}
              />
            ) : (
              <Avatar.Icon
                size={120}
                icon="account"
                style={styles.previewAvatar}
              />
            )}
          </View>

          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => {
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <Pressable
                  key={avatar.id}
                  onPress={() => setSelectedAvatarId(avatar.id)}
                  style={[
                    styles.avatarItem,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.outline,
                    },
                  ]}
                >
                  <Image source={avatar.source} style={styles.avatarImage} />
                </Pressable>
              );
            })}
          </View>

          <TextInput
            mode="outlined"
            label="Imię"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    previewWrapper: {
      alignItems: "center",
      marginBottom: 16,
    },
    previewAvatar: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    avatarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 20,
    },
    avatarItem: {
      width: "30%",
      aspectRatio: 1,
      borderRadius: 16,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    avatarImage: {
      width: "70%",
      height: "70%",
      resizeMode: "contain",
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
  });
