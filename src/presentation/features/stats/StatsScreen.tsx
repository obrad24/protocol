import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type {
  StatsDashboard,
  StatsPeriod,
} from '../../../application/stats/getStatsDashboard';
import { CircularProgress } from '../../components/CircularProgress';
import { ConsistencyGrid } from '../../components/ConsistencyGrid';
import { MiniBarChart } from '../../components/MiniBarChart';
import { useUseCases } from '../../providers/AppProviders';
import type { RootTabParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type Nav = BottomTabNavigationProp<RootTabParamList, 'Stats'>;

export function StatsScreen() {
  const { getStatsDashboard } = useUseCases();
  const navigation = useNavigation<Nav>();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [stats, setStats] = useState<StatsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getStatsDashboard(period));
    } finally {
      setLoading(false);
    }
  }, [getStatsDashboard, period]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistike</Text>
        <View style={styles.segment}>
          {([
            ['week', 'Sedmica'],
            ['month', 'Mjesec'],
          ] as const).map(([value, label]) => {
            const active = period === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPeriod(value)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading || !stats ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !stats.hasActivePlan ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nema aktivnog plana</Text>
          <Text style={styles.emptyText}>
            Kreiraj ili aktiviraj plan da vidiš statistike.
          </Text>
          <Pressable style={styles.cta} onPress={() => navigation.navigate('CreatePlan')}>
            <Text style={styles.ctaText}>Kreiraj plan</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <CircularProgress percent={stats.overallPercent} size={110} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.heroTitle}>
                {period === 'week' ? 'Sedmični' : 'Mjesečni'} rezultat
              </Text>
              <Text style={styles.heroMeta}>
                {stats.completedCount} / {stats.expectedCount} završeno
              </Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <Kpi label="Završeno" value={`${stats.completedCount}`} />
            <Kpi label="Streak" value={`${stats.streak}d`} />
            <Kpi label="Prosjek/dan" value={`${stats.dailyAverage}`} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aktivnost</Text>
            <MiniBarChart bars={stats.dayBars} height={100} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Konzistentnost</Text>
            <Text style={styles.cardMeta}>
              Najduži perfect niz u periodu: {stats.longestStreakInView} dana
            </Text>
            <ConsistencyGrid bars={stats.dayBars} />
          </View>

          <Text style={styles.sectionTitle}>Najbolje navike</Text>
          {stats.habitStats.length === 0 ? (
            <Text style={styles.emptyText}>Još nema dovoljno podataka.</Text>
          ) : (
            stats.habitStats.slice(0, 6).map((habit) => (
              <View key={habit.taskId} style={styles.habitCard}>
                <View style={styles.habitTop}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <Text style={styles.habitPercent}>{habit.percent}%</Text>
                </View>
                <Text style={styles.habitMeta}>
                  {habit.completed} / {habit.expected}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${habit.percent}%` }]} />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  title: { ...typography.title, color: colors.text },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 4,
    ...shadows.card,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  segmentTextActive: { color: '#FFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.card,
  },
  heroTitle: { ...typography.subtitle, color: colors.text },
  heroMeta: { ...typography.body, color: colors.textMuted },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  kpiValue: { ...typography.subtitle, color: colors.text },
  kpiLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: { ...typography.subtitle, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  habitTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  habitTitle: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
  habitPercent: { ...typography.subtitle, fontSize: 14, color: colors.primary },
  habitMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  barFill: { height: '100%', backgroundColor: colors.primary },
  emptyCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  emptyTitle: { ...typography.subtitle, color: colors.text },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  cta: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ctaText: { color: '#FFF', fontWeight: '600' },
});
