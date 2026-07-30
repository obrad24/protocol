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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeDashboard } from '../../../application/home/getHomeDashboard';
import type { RecurrenceRule } from '../../../domain/value-objects/RecurrenceRule';
import { greetingNow } from '../../../shared/utils/greeting';
import { CircularProgress } from '../../components/CircularProgress';
import { MiniBarChart } from '../../components/MiniBarChart';
import { useUseCases } from '../../providers/AppProviders';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function recurrenceLabel(rule: RecurrenceRule): string {
  switch (rule.type) {
    case 'daily':
      return 'Svaki dan';
    case 'weekly_count':
      return `${rule.timesPerWeek}x sedmično`;
    case 'weekdays':
      return 'Odabrani dani';
    case 'monthly_count':
      return `${rule.timesPerMonth}x mjesečno`;
  }
}

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('bs-BA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function HomeScreen() {
  const { getHomeDashboard, toggleTaskCompletion } = useUseCases();
  const navigation = useNavigation<Nav>();
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await getHomeDashboard());
    } finally {
      setLoading(false);
    }
  }, [getHomeDashboard]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onToggle = async (taskId: string) => {
    if (!dashboard?.activePlan) return;
    setTogglingId(taskId);
    try {
      await toggleTaskCompletion({ planId: dashboard.activePlan.id, taskId });
      setDashboard(await getHomeDashboard());
    } finally {
      setTogglingId(null);
    }
  };

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = dashboard.progress;
  const remaining =
    progress && progress.dailyTotal > 0
      ? progress.dailyTotal - progress.dailyCompleted
      : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greetingNow(dashboard.greetingName)}</Text>
            <Text style={styles.date}>{formatDateLabel(dashboard.date)}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {!dashboard.activePlan ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nema aktivnog plana</Text>
            <Text style={styles.emptyText}>
              Kreiraj plan ili izaberi postojeći da vidiš današnje obaveze.
            </Text>
            <Pressable style={styles.cta} onPress={() => navigation.navigate('CreatePlan')}>
              <Text style={styles.ctaText}>Kreiraj plan</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.progressCard}>
              <CircularProgress percent={progress?.dailyPercent ?? 0} />
              <View style={styles.progressMeta}>
                <Text style={styles.progressTitle}>Dnevni progres</Text>
                <Text style={styles.progressCount}>
                  {progress?.dailyCompleted ?? 0} / {progress?.dailyTotal ?? 0} zadataka
                </Text>
                <Text style={styles.progressHint}>
                  {remaining > 0
                    ? `Još ${remaining} do perfect day`
                    : progress && progress.dailyTotal > 0
                      ? 'Perfect day!'
                      : 'Nema zadataka za danas'}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricChip
                icon="flame"
                label="Streak"
                value={`${dashboard.streak}d`}
                tint={colors.streak}
              />
              <MetricChip
                icon="calendar"
                label="Sedmica"
                value={`${progress?.weeklyPercent ?? 0}%`}
              />
              <MetricChip
                icon="stats-chart"
                label="Mjesec"
                value={`${progress?.monthlyPercent ?? 0}%`}
              />
            </View>

            <View style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <Text style={styles.progressTitle}>Sedmični pregled</Text>
                <Text style={styles.weekPercent}>{progress?.weeklyPercent ?? 0}%</Text>
              </View>
              <Text style={styles.progressCount}>
                {progress?.dailyCompleted ?? 0} danas · cilj sedmice{' '}
                {progress?.weeklyPercent ?? 0}%
              </Text>
              <MiniBarChart bars={dashboard.weeklyBars} />
            </View>

            <Text style={styles.sectionTitle}>Današnje obaveze</Text>
            {dashboard.todayTasks.length === 0 ? (
              <Text style={styles.emptyText}>Nema zadataka zakazanih za danas.</Text>
            ) : (
              dashboard.todayTasks.map(({ task, completed }) => (
                <Pressable
                  key={task.id}
                  style={styles.habitRow}
                  disabled={togglingId === task.id}
                  onPress={() => void onToggle(task.id)}
                >
                  <View style={styles.habitIcon}>
                    <Ionicons name="checkmark-done" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.habitTitle, completed && styles.habitDone]}>
                      {task.title}
                    </Text>
                    <Text style={styles.habitMeta}>{recurrenceLabel(task.recurrence)}</Text>
                  </View>
                  <View style={[styles.checkbox, completed && styles.checkboxOn]}>
                    {completed ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
                  </View>
                </Pressable>
              ))
            )}

            <Text style={styles.sectionTitle}>Aktivni plan</Text>
            <View style={styles.planCard}>
              <Text style={styles.planName}>{dashboard.activePlan.name}</Text>
              {dashboard.activePlan.description ? (
                <Text style={styles.planDesc} numberOfLines={2}>
                  {dashboard.activePlan.description}
                </Text>
              ) : null}
              <View style={styles.planProgressTrack}>
                <View
                  style={[
                    styles.planProgressFill,
                    { width: `${progress?.planCompletionPercent ?? 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.planPercent}>
                {progress?.planCompletionPercent ?? 0}% završeno
              </Text>
            </View>

            <Pressable
              style={styles.achievementsLink}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Ionicons name="trophy" size={18} color={colors.primary} />
              <Text style={styles.achievementsLinkText}>Pogledaj dostignuća</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricChip({
  icon,
  label,
  value,
  tint = colors.primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint?: string;
}) {
  return (
    <View style={styles.metricChip}>
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  greeting: { ...typography.title, fontSize: 24, color: colors.text },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 4, textTransform: 'capitalize' },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.card,
  },
  progressMeta: { flex: 1, gap: 4 },
  progressTitle: { ...typography.subtitle, color: colors.text },
  progressCount: { ...typography.body, color: colors.textMuted },
  progressHint: { ...typography.caption, color: colors.primary, marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
    ...shadows.card,
  },
  metricLabel: { ...typography.caption, color: colors.textMuted },
  metricValue: { ...typography.subtitle, fontSize: 14, color: colors.text },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekPercent: { ...typography.subtitle, color: colors.primary },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
  habitRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  habitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  habitDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  habitMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  planName: { ...typography.subtitle, color: colors.text },
  planDesc: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  planProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  planProgressFill: { height: '100%', backgroundColor: colors.primary },
  planPercent: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  achievementsLink: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  achievementsLinkText: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
  emptyCard: {
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
