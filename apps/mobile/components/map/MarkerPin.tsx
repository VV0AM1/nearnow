import React from 'react';
import { View } from 'react-native';
import type { MarkerShape } from '@/lib/map-bridge';

const SIZE = 20;

/** Category marker for native maps: colour plus shape, so colour is never the only signal. */
export function MarkerPin({ color, shape, dim }: { color: string; shape: MarkerShape; dim: boolean }) {
  const opacity = dim ? 0.45 : 1;
  if (shape === 'triangle') {
    return (
      <View style={{ width: SIZE + 4, height: SIZE + 2, alignItems: 'center', justifyContent: 'flex-end', opacity }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: SIZE / 2 + 2,
            borderRightWidth: SIZE / 2 + 2,
            borderBottomWidth: SIZE + 2,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }}
        />
      </View>
    );
  }
  return (
    <View style={{ width: SIZE + 6, height: SIZE + 6, alignItems: 'center', justifyContent: 'center', opacity }}>
      <View
        style={{
          width: shape === 'diamond' ? SIZE - 3 : SIZE,
          height: shape === 'diamond' ? SIZE - 3 : SIZE,
          backgroundColor: color,
          borderRadius: shape === 'circle' ? SIZE / 2 : 3,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          transform: shape === 'diamond' ? [{ rotate: '45deg' }] : undefined,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </View>
  );
}
