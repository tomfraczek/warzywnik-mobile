import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CoachMarkStep = {
  ref: React.RefObject<View | null>;
  title: string;
  description: string;
  placement: "top" | "bottom";
};

type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  steps: CoachMarkStep[];
  visible: boolean;
  onDismiss: (dontShowAgain: boolean) => void;
  beforeStepMeasure?: (stepIndex: number) => Promise<void>;
};

const PADDING = 8;
const TOOLTIP_MARGIN = 14;
const TOOLTIP_HEIGHT_ESTIMATE = 220;

const computeTooltipTop = (
  hl: HighlightRect | null,
  placement: "top" | "bottom",
  screenHeight: number,
): number => {
  if (!hl) return screenHeight / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;

  const minTop = 60;
  // Clamp to viewport — hl.height can be huge for tall sections that extend
  // off-screen, which would push the tooltip completely off the bottom.
  const maxTop = screenHeight - TOOLTIP_HEIGHT_ESTIMATE - 60;

  if (placement === "bottom") {
    const below = hl.y + hl.height + PADDING + TOOLTIP_MARGIN;
    if (below + TOOLTIP_HEIGHT_ESTIMATE <= screenHeight - 20) {
      return Math.min(maxTop, below);
    }
    return Math.max(minTop, hl.y - TOOLTIP_HEIGHT_ESTIMATE - PADDING - TOOLTIP_MARGIN);
  }

  const above = hl.y - TOOLTIP_HEIGHT_ESTIMATE - PADDING - TOOLTIP_MARGIN;
  if (above >= minTop) return above;

  // Not enough room above — clamp below-fallback to stay inside viewport
  const below = hl.y + hl.height + PADDING + TOOLTIP_MARGIN;
  return Math.min(maxTop, Math.max(minTop, below));
};

export function CoachMarkOverlay({
  steps,
  visible,
  onDismiss,
  beforeStepMeasure,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { top: safeTop, left: safeLeft } = useSafeAreaInsets();

  const animTop = useSharedValue(screenHeight / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2);
  const tooltipAnimStyle = useAnimatedStyle(() => ({ top: animTop.value }));

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const measureCurrentStep = useCallback(() => {
    const step = steps[stepIndex];

    const doMeasure = () => {
      if (!step?.ref.current) {
        setHighlight(null);
        animTop.value = withTiming(
          screenHeight / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2,
          { duration: 280, easing: Easing.out(Easing.cubic) },
        );
        return;
      }
      step.ref.current.measureInWindow((x, y, width, height) => {
        // measureInWindow in Fabric returns coords relative to safe-area
        // content, not the full window. Modal renders from window y=0, so
        // we compensate with the safe area insets.
        const adjY = y + safeTop;
        const adjX = x + safeLeft;
        // Only check the top of the element – tall sections extend off-screen
        const isOnScreen = width > 0 && height > 0 && adjY >= 0 && adjY < screenHeight;
        const hl = isOnScreen ? { x: adjX, y: adjY, width, height } : null;
        setHighlight(hl);
        animTop.value = withTiming(
          computeTooltipTop(hl, step.placement, screenHeight),
          { duration: 280, easing: Easing.out(Easing.cubic) },
        );
      });
    };

    if (beforeStepMeasure) {
      void beforeStepMeasure(stepIndex).then(doMeasure);
    } else {
      setTimeout(doMeasure, 300);
    }
  // animTop is a Reanimated SharedValue (ref-like, stable across renders)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, stepIndex, screenHeight, beforeStepMeasure, safeTop, safeLeft]);

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      setHighlight(null);
      setDontShowAgain(false);
      animTop.value = screenHeight / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
      return;
    }
    measureCurrentStep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, stepIndex, measureCurrentStep]);

  const handleNext = () => {
    if (isLastStep) {
      onDismiss(dontShowAgain);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleSkip = () => {
    onDismiss(false);
  };

  if (!visible || !currentStep) return null;

  const hl = highlight;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {hl ? (
          <>
            {/* top */}
            <View
              style={[
                styles.overlay,
                { top: 0, left: 0, right: 0, height: Math.max(0, hl.y - PADDING) },
              ]}
            />
            {/* bottom */}
            <View
              style={[
                styles.overlay,
                {
                  top: hl.y + hl.height + PADDING,
                  left: 0,
                  right: 0,
                  height: screenHeight - (hl.y + hl.height + PADDING),
                },
              ]}
            />
            {/* left */}
            <View
              style={[
                styles.overlay,
                {
                  top: hl.y - PADDING,
                  left: 0,
                  width: Math.max(0, hl.x - PADDING),
                  height: hl.height + PADDING * 2,
                },
              ]}
            />
            {/* right */}
            <View
              style={[
                styles.overlay,
                {
                  top: hl.y - PADDING,
                  left: hl.x + hl.width + PADDING,
                  width: screenWidth - (hl.x + hl.width + PADDING),
                  height: hl.height + PADDING * 2,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.highlightRing,
                {
                  top: hl.y - PADDING,
                  left: hl.x - PADDING,
                  width: hl.width + PADDING * 2,
                  height: hl.height + PADDING * 2,
                },
              ]}
            />
          </>
        ) : (
          <View style={[styles.overlay, StyleSheet.absoluteFill]} />
        )}

        <Animated.View
          style={[styles.tooltip, tooltipAnimStyle, { left: 16, right: 16 }]}
        >
          <View style={styles.dotsRow}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Text style={styles.tooltipTitle}>{currentStep.title}</Text>
          <Text style={styles.tooltipDescription}>{currentStep.description}</Text>

          {isLastStep ? (
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setDontShowAgain((v) => !v)}
            >
              <Checkbox
                status={dontShowAgain ? "checked" : "unchecked"}
                onPress={() => setDontShowAgain((v) => !v)}
                color="#4C7A5E"
              />
              <Text style={styles.checkboxLabel}>Nie pokazuj więcej</Text>
            </Pressable>
          ) : null}

          <View style={styles.buttonRow}>
            {stepIndex > 0 ? (
              <Pressable onPress={handleBack} hitSlop={8} style={styles.sideButton}>
                <Text style={styles.backText}>← Wstecz</Text>
              </Pressable>
            ) : (
              <View style={styles.sideButton} />
            )}

            <View style={styles.rightButtons}>
              <Pressable onPress={handleSkip} hitSlop={8}>
                <Text style={styles.skipText}>Pomiń</Text>
              </Pressable>
              <Pressable onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextText}>
                  {isLastStep ? "Zakończ" : "Dalej →"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  highlightRing: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    gap: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D9D5",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#4C7A5E",
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D2420",
  },
  tooltipDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4D5753",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#1D2420",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sideButton: {
    minWidth: 72,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4C7A5E",
  },
  skipText: {
    fontSize: 14,
    color: "#8A938F",
  },
  nextButton: {
    backgroundColor: "#4C7A5E",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  nextText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
