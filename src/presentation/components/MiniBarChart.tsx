import { StyleSheet, Text, View } from 'react-native';

import type { DayBar } from '../../domain/policies/AnalyticsCalculator';
import { colors, radii, spacing, typography } from '../theme';

type MiniBarChartProps = {
  bars: DayBar[];
  height?: number;
};

export function MiniBarChart({ bars, height = 72 }: MiniBarChartProps) {
  if (bars.length === 0) {
    return <Text style={styles.empty}>Nema podataka</Text>;
  }

  return (
    <View style={[styles.row, { height }]}>
      {bars.map((bar) => {
        const fill = Math.max(bar.total === 0 ? 0 : bar.percent, bar.total === 0 ? 0 : 4);
        return (
          <View key={bar.date} style={styles.col}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    height: `${fill}%`,
                    backgroundColor: bar.percent === 100 ? colors.success : colors.primary,
                    opacity: bar.total === 0 ? 0.25 : 1,
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{bar.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  track: {
    flex: 1,
    width: '70%',
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: radii.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 11,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
