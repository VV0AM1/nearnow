import React, { useEffect } from 'react';
import { View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTokens } from './theme';
import { continuous, elevation } from './tokens';

export interface DetentSheetProps {
  /** Visible heights in px, ascending (e.g. peek, half, full). */
  detents: number[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Always visible, and the drag area. */
  header: React.ReactNode;
  children: React.ReactNode;
  /** Spoken for the drag handle, e.g. "Show list" / "Hide list". */
  expandLabel: string;
  collapseLabel: string;
}

/**
 * Persistent bottom sheet over content (like Apple Maps): drag the header between
 * detents, flick to skip, tap the handle to toggle. Screen readers get an
 * adjustable handle instead of a gesture. Under Reduce Motion it moves with a short linear timing instead of a spring.
 */
export function DetentSheet({ detents, index, onIndexChange, header, children, expandLabel, collapseLabel }: DetentSheetProps) {
  const t = useTokens();
  const max = detents[detents.length - 1];
  const visible = useSharedValue(detents[index]);
  const start = useSharedValue(0);

  const animateTo = (h: number) => {
    'worklet';
    visible.value = t.reduceMotion ? withTiming(h, { duration: 120 }) : withSpring(h, t.motion.spring.snappy);
  };

  useEffect(() => {
    animateTo(detents[Math.max(0, Math.min(index, detents.length - 1))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, detents.join(',')]);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onBegin(() => {
      start.value = visible.value;
    })
    .onUpdate((e) => {
      visible.value = Math.max(detents[0], Math.min(max, start.value - e.translationY));
    })
    .onEnd((e) => {
      // Project the flick a little so a quick swipe moves one detent further.
      const target = visible.value - e.velocityY * 0.12;
      let best = 0;
      for (let i = 1; i < detents.length; i++) if (Math.abs(detents[i] - target) < Math.abs(detents[best] - target)) best = i;
      animateTo(detents[best]);
      runOnJS(onIndexChange)(best);
    });

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: max - visible.value }] }));

  const expanded = index >= detents.length - 1;
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment' || (e.nativeEvent.actionName === 'activate' && !expanded)) onIndexChange(Math.min(detents.length - 1, index + 1));
    else onIndexChange(Math.max(0, index - 1));
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: max,
          backgroundColor: t.colors.surface,
          borderTopLeftRadius: t.radius.xl,
          borderTopRightRadius: t.radius.xl,
          ...continuous,
          ...elevation(2, t.scheme),
        },
        sheet,
      ]}
    >
      <GestureDetector gesture={pan}>
        <View>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={expanded ? collapseLabel : expandLabel}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
            onAccessibilityAction={onAction}
            style={{ alignItems: 'center', paddingTop: t.space.sm, paddingBottom: t.space.xs }}
          >
            <View
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => onIndexChange(index === 0 ? 1 : 0)}
              hitSlop={{ top: 12, bottom: 12, left: 40, right: 40 }}
              style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: t.colors.separator }}
            />
          </View>
          {header}
        </View>
      </GestureDetector>
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}
