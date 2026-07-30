import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, typography } from '../theme';

type CircularProgressProps = {
  percent: number;
  size?: number;
  stroke?: number;
};

export function CircularProgress({ percent, size = 100, stroke = 10 }: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          stroke={colors.primaryMuted}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <Circle
          stroke={colors.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.percent}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  percent: {
    ...typography.subtitle,
    color: colors.text,
    position: 'absolute',
  },
});
