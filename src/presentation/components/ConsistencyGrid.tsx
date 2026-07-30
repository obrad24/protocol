import { StyleSheet, View } from 'react-native';

import type { DayBar } from '../../domain/policies/AnalyticsCalculator';
import { colors, spacing } from '../theme';

type ConsistencyGridProps = {
  bars: DayBar[];
};

function cellColor(bar: DayBar): string {
  if (bar.total === 0) return colors.border;
  if (bar.percent >= 100) return colors.primary;
  if (bar.percent >= 60) return '#A78BFA';
  if (bar.percent > 0) return colors.primaryMuted;
  return colors.border;
}

export function ConsistencyGrid({ bars }: ConsistencyGridProps) {
  return (
    <View style={styles.grid}>
      {bars.map((bar) => (
        <View key={bar.date} style={[styles.cell, { backgroundColor: cellColor(bar) }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});
