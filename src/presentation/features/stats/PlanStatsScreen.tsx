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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import type {
  StatsDashboard,
  StatsPeriod,
} from '../../../application/stats/getStatsDashboard';
import { CircularProgress } from '../../components/CircularProgress';
import { ConsistencyGrid } from '../../components/ConsistencyGrid';
import { MiniBarChart } from '../../components/MiniBarChart';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootStackParamList } from '../../navigation/types';
import { radii, shadows, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlanStats'>;
type Route = RouteProp<RootStackParamList, 'PlanStats'>;

export function PlanStatsScreen() {
  const { getStatsDashboard } = useUseCases();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors, t } = useI18nTheme();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [stats, setStats] = useState<StatsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getStatsDashboard(route.params.planId, period));
    } finally {
      setLoading(false);
    }
  }, [getStatsDashboard, period, route.params.planId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {stats?.planName || t('statsTitle')}
        </Text>
        <View style={styles.segment}>
          {(
            [
              ['week', t('statsWeek')],
              ['month', t('statsMonth')],
            ] as const
          ).map(([value, label]) => {
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
      ) : !stats.hasPlan ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t('error')}</Text>
          <Pressable style={styles.cta} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaText}>{t('statsBackToPlans')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <CircularProgress percent={stats.overallPercent} size={110} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.heroTitle}>
                {period === 'week' ? t('statsWeeklyResult') : t('statsMonthlyResult')}
              </Text>
              <Text style={styles.heroMeta}>
                {stats.completedCount} / {stats.expectedCount} {t('statsCompleted').toLowerCase()}
              </Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <Kpi colors={colors} label={t('statsCompleted')} value={`${stats.completedCount}`} />
            <Kpi colors={colors} label={t('streak')} value={`${stats.streak}d`} />
            <Kpi colors={colors} label={t('statsAvgDay')} value={`${stats.dailyAverage}`} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('statsActivity')}</Text>
            <MiniBarChart bars={stats.dayBars} height={100} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('statsConsistency')}</Text>
            <Text style={styles.cardMeta}>
              {t('statsLongestStreak').replace(
                '{count}',
                String(stats.longestStreakInView),
              )}
            </Text>
            <ConsistencyGrid bars={stats.dayBars} />
          </View>

          <Text style={styles.sectionTitle}>{t('statsBestHabits')}</Text>
          {stats.habitStats.length === 0 ? (
            <Text style={styles.emptyText}>{t('statsNotEnoughData')}</Text>
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

function Kpi({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useI18nTheme>['colors'];
}) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
    title: { ...typography.title, color: colors.text, fontSize: 22 },
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
}
