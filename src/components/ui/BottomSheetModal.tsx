import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { MD3Theme, Surface, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetModalProps = {
  visible: boolean;
  onDismiss: () => void;
  dismissDisabled?: boolean;
  children: React.ReactNode;
};

const OPEN_DURATION = 220;
const CLOSE_DURATION = 180;

export function BottomSheetModal({
  visible,
  onDismiss,
  dismissDisabled = false,
  children,
}: BottomSheetModalProps) {
  const theme = useTheme<MD3Theme>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);

  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateY]);

  const animateOut = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: CLOSE_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: Math.max(sheetHeight, 320),
          duration: CLOSE_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) callback?.();
      });
    },
    [backdropOpacity, sheetHeight, translateY],
  );

  const triggerDismiss = useCallback(() => {
    if (dismissDisabled) return;
    animateOut(onDismiss);
  }, [dismissDisabled, animateOut, onDismiss]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => animateIn());
      return;
    }

    if (mounted) {
      animateOut(() => setMounted(false));
    }
  }, [visible, mounted, animateIn, animateOut]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 4 && Math.abs(gestureState.dx) < 16,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy <= 0) return;
          translateY.setValue(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          const closeThreshold = Math.max(96, sheetHeight * 0.25);
          if (gestureState.dy > closeThreshold || gestureState.vy > 1.1) {
            triggerDismiss();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 240,
            mass: 0.9,
            useNativeDriver: true,
          }).start();
        },
      }),
    [sheetHeight, translateY, triggerDismiss],
  );

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={triggerDismiss}
    >
      <View pointerEvents="box-none" style={styles.overlayRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={triggerDismiss} />
        </Animated.View>

        <Animated.View
          style={[styles.sheetWrap, { transform: [{ translateY }] }]}
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
        >
          <Surface
            elevation={0}
            style={[
              styles.sheetSurface,
              { paddingBottom: Math.max(12, insets.bottom) },
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.handleTouchArea}>
              <View style={styles.handle} />
            </View>
            <View style={styles.content}>{children}</View>
          </Surface>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    overlayRoot: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.36)",
    },
    sheetWrap: {
      width: "100%",
      justifyContent: "flex-end",
    },
    sheetSurface: {
      width: "100%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingTop: 6,
    },
    handleTouchArea: {
      alignItems: "center",
      justifyContent: "center",
      height: 26,
      marginBottom: 2,
    },
    handle: {
      width: 52,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.outline,
    },
    content: {
      gap: 12,
    },
  });
