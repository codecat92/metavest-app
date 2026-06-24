import { useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle } from 'react-native';
import { useColors, radius } from '@/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 20, borderRadius: br = radius.md, style }: SkeletonProps) {
  const c = useColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius: br,
          backgroundColor: c.glass.g2,
          opacity,
        },
        style,
      ]}
    />
  );
}
