import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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

import type {
  HomeActivePlanSummary,
  HomeDashboard,
} from '../../../application/home/getHomeDashboard';
import type { PeriodOverview } from '../../../application/home/periodOverview';
import type { YesterdayReview } from '../../../application/home/yesterdayReview';
import type { RecurrenceRule } from '../../../domain/value-objects/RecurrenceRule';
import { greetingNow } from '../../../shared/utils/greeting';
import { CircularProgress } from '../../components/CircularProgress';
import { MiniBarChart } from '../../components/MiniBarChart';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { radii, shadows, spacing, typography } from '../../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type HomeView = 'hub' | 'detail';

function recurrenceLabel(rule: RecurrenceRule, t: ReturnType<typeof useI18nTheme>['t']): string {
  switch (rule.type) {
    case 'daily':
      return t('recurrenceDaily');
    case 'weekly_count':
      return `${rule.timesPerWeek}×`;
    case 'weekdays':
      return t('recurrenceWeekdays');
    case 'monthly_count':
      return `${rule.timesPerMonth}×`;
  }
}

function goalMetLabel(rule: RecurrenceRule, t: ReturnType<typeof useI18nTheme>['t']): string {
  switch (rule.type) {
    case 'weekly_count':
      return t('weeklyGoalMet');
    case 'monthly_count':
      return t('monthlyGoalMet');
    default:
      return t('dailyGoalMet');
  }
}

function bonusLabel(
  bonus: number,
  t: ReturnType<typeof useI18nTheme>['t'],
): string | null {
  if (bonus <= 0) return null;
  if (bonus === 1) return t('bonusAbovePlan');
  return t('bonusPlusCount').replace('{count}', String(bonus));
}

function formatDateLabel(date: string, locale: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'bs-BA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function HomeScreen() {
  const {
    getHomeDashboard,
    toggleTaskCompletion,
    getYesterdayReview,
    getPendingPeriodOverviews,
    markPeriodOverviewSeen,
    listPendingPlanOverviews,
    ensurePlanSummaries,
  } = useUseCases();
  const navigation = useNavigation<Nav>();
  const { colors, t, motivation, locale } = useI18nTheme();
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [yesterday, setYesterday] = useState<YesterdayReview | null>(null);
  const [yesterdayOpen, setYesterdayOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [view, setView] = useState<HomeView>('hub');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensurePlanSummaries();
      const [dash, periods, pendingPlans] = await Promise.all([
        getHomeDashboard(selectedPlanId),
        getPendingPeriodOverviews(),
        listPendingPlanOverviews(),
      ]);
      setDashboard(dash);
      if (dash.activePlan && selectedPlanId !== dash.activePlan.id) {
        setSelectedPlanId(dash.activePlan.id);
      }
      if (!dash.activePlan) {
        setView('hub');
        setSelectedPlanId(null);
      }
      const yest = await getYesterdayReview(dash.activePlan?.id ?? selectedPlanId);
      setYesterday(yest);
      if (pendingPlans[0]) {
        navigation.navigate('PlanOverview', { planId: pendingPlans[0].plan.id });
      } else if (periods[0]) {
        setPeriod(periods[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [
    ensurePlanSummaries,
    getHomeDashboard,
    getPendingPeriodOverviews,
    getYesterdayReview,
    listPendingPlanOverviews,
    navigation,
    selectedPlanId,
  ]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refreshSoft = async (planId?: string | null) => {
    const id = planId ?? selectedPlanId;
    const dash = await getHomeDashboard(id);
    setDashboard(dash);
    setYesterday(await getYesterdayReview(dash.activePlan?.id ?? id));
  };

  const selectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    setLoading(true);
    try {
      const dash = await getHomeDashboard(planId);
      setDashboard(dash);
      setYesterday(await getYesterdayReview(planId));
      setView('detail');
      setYesterdayOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onToggle = async (taskId: string, date?: string, addBonus?: boolean) => {
    if (!dashboard?.activePlan) return;
    setTogglingId(taskId);
    try {
      await toggleTaskCompletion({
        planId: dashboard.activePlan.id,
        taskId,
        date,
        addBonus,
      });
      await refreshSoft(dashboard.activePlan.id);
    } finally {
      setTogglingId(null);
    }
  };

  const dismissPeriod = async () => {
    if (!period) return;
    await markPeriodOverviewSeen(period.kind, period.periodId);
    const rest = await getPendingPeriodOverviews();
    setPeriod(rest[0] ?? null);
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const perfectDayHint = (() => {
    if (!progress || progress.perfectDayTotal <= 0) return '—';
    if (progress.perfectDay) return t('perfectDayAchieved');
    const count = progress.perfectDayRemaining;
    if (count === 1) return t('perfectDayRemainingOne');
    if (count >= 2 && count <= 4) {
      return t('perfectDayRemainingFew').replace('{count}', String(count));
    }
    return t('perfectDayRemainingOther').replace('{count}', String(count));
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {view === 'detail' ? (
              <Pressable
                style={styles.backRow}
                onPress={() => {
                  setView('hub');
                  setYesterdayOpen(false);
                }}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
                <Text style={styles.backText}>{t('homeBackToPlans')}</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.greeting}>{greetingNow(dashboard.greetingName)}</Text>
                <Text style={styles.date}>{formatDateLabel(dashboard.date, locale)}</Text>
              </>
            )}
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {dashboard.activePlans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('noActivePlanTitle')}</Text>
            <Text style={styles.emptyText}>{t('noActivePlanBody')}</Text>
            <Pressable style={styles.cta} onPress={() => navigation.navigate('CreatePlan')}>
              <Text style={styles.ctaText}>{t('createFirstPlan')}</Text>
            </Pressable>
          </View>
        ) : view === 'hub' ? (
          <>
            <Text style={styles.sectionTitle}>{t('homeActivePlans')}</Text>
            {dashboard.activePlans.map((plan) => (
              <ActivePlanHeroCard
                key={plan.id}
                plan={plan}
                styles={styles}
                colors={colors}
                t={t}
                onPress={() => void selectPlan(plan.id)}
              />
            ))}
          </>
        ) : dashboard.activePlan ? (
          <>
            {dashboard.activePlans.length > 1 ? (
              <View style={styles.switcherRow}>
                {dashboard.activePlans.map((plan) => {
                  const active = plan.id === dashboard.activePlan?.id;
                  return (
                    <Pressable
                      key={plan.id}
                      style={[styles.switcherChip, active && styles.switcherChipOn]}
                      onPress={() => void selectPlan(plan.id)}
                    >
                      <Text
                        style={[styles.switcherText, active && styles.switcherTextOn]}
                        numberOfLines={1}
                      >
                        {plan.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <ActivePlanHeroCard
              plan={{
                id: dashboard.activePlan.id,
                name: dashboard.activePlan.name,
                description: dashboard.activePlan.description,
                planCompletionPercent: progress?.planCompletionPercent ?? 0,
                dailyPercent: progress?.dailyPercent ?? 0,
                streak: dashboard.streak,
              }}
              styles={styles}
              colors={colors}
              t={t}
              compact
            />

            <View style={styles.progressCard}>
              <CircularProgress percent={progress?.dailyPercent ?? 0} />
              <View style={styles.progressMeta}>
                <Text style={styles.progressTitle}>{t('dailyProgress')}</Text>
                <Text style={styles.progressCount}>
                  {progress?.dailyCompleted ?? 0} / {progress?.dailyTotal ?? 0}
                </Text>
                <Text style={styles.progressHint}>{perfectDayHint}</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricChip
                colors={colors}
                styles={styles}
                icon="flame"
                label={t('streak')}
                value={`${dashboard.streak}d`}
                tint={colors.streak}
              />
              <MetricChip
                colors={colors}
                styles={styles}
                icon="calendar"
                label={t('week')}
                value={`${progress?.weeklyPercent ?? 0}%`}
              />
              <MetricChip
                colors={colors}
                styles={styles}
                icon="stats-chart"
                label={t('month')}
                value={`${progress?.monthlyPercent ?? 0}%`}
              />
            </View>

            <View style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <Text style={styles.progressTitle}>{t('weeklyReview')}</Text>
                <Text style={styles.weekPercent}>{progress?.weeklyPercent ?? 0}%</Text>
              </View>
              <MiniBarChart bars={dashboard.weeklyBars} />
            </View>

            <Text style={styles.sectionTitle}>{t('todayTasks')}</Text>
            {dashboard.todayTasks.length === 0 ? (
              <Text style={styles.emptyText}>—</Text>
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
                    {task.description ? (
                      <Text style={styles.habitMeta} numberOfLines={2}>
                        {task.description}
                      </Text>
                    ) : (
                      <Text style={styles.habitMeta}>{recurrenceLabel(task.recurrence, t)}</Text>
                    )}
                  </View>
                  <View style={[styles.checkbox, completed && styles.checkboxOn]}>
                    {completed ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
                  </View>
                </Pressable>
              ))
            )}

            {dashboard.planFulfilledTasks.length > 0 ? (
              <>
                <View style={styles.fulfilledDivider}>
                  <View style={styles.fulfilledLine} />
                  <Text style={styles.fulfilledDividerText}>{t('planFulfilledSection')}</Text>
                  <View style={styles.fulfilledLine} />
                </View>
                {dashboard.planFulfilledTasks.map(({ task, period: taskPeriod }) => {
                  const statusText =
                    taskPeriod.bonus > 0
                      ? bonusLabel(taskPeriod.bonus, t)
                      : `🎉 ${goalMetLabel(task.recurrence, t)}`;
                  return (
                    <View key={`fulfilled-${task.id}`} style={styles.fulfilledCard}>
                      <Text style={styles.habitTitle}>
                        {task.title} {taskPeriod.done}/{taskPeriod.target}
                      </Text>
                      <Text style={styles.progressHint}>{statusText}</Text>
                      <Pressable
                        style={styles.addMoreBtn}
                        disabled={togglingId === task.id}
                        onPress={() => void onToggle(task.id, undefined, true)}
                      >
                        <Text style={styles.addMoreText}>{t('addOneMore')}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </>
            ) : null}

            <Pressable
              style={styles.achievementsLink}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Ionicons name="trophy" size={18} color={colors.primary} />
              <Text style={styles.achievementsLinkText}>{t('viewAchievements')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {yesterday?.available ? (
              <View style={styles.yesterdayCard}>
                <View style={styles.weekHeader}>
                  <Text style={styles.progressTitle}>{t('yesterdayTitle')}</Text>
                  <Text style={styles.weekPercent}>{yesterday.percent}%</Text>
                </View>
                {yesterday.percent === 100 ? (
                  <Text style={styles.progressHint}>{t('yesterdayPerfect')}</Text>
                ) : (
                  <Pressable onPress={() => setYesterdayOpen((v) => !v)}>
                    <Text style={styles.progressHint}>{t('yesterdayFill')}</Text>
                  </Pressable>
                )}
                {(yesterdayOpen || yesterday.percent === 100) &&
                  yesterday.tasks.map(({ task, completed }) => (
                    <Pressable
                      key={`y-${task.id}`}
                      style={styles.habitRow}
                      disabled={togglingId === task.id}
                      onPress={() => void onToggle(task.id, yesterday.date)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.habitTitle, completed && styles.habitDone]}>
                          {task.title}
                        </Text>
                        <Text style={styles.habitMeta}>
                          {completed ? t('yesterdayDone') : t('yesterdayMissed')}
                        </Text>
                      </View>
                      <View style={[styles.checkbox, completed && styles.checkboxOn]}>
                        {completed ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
                      </View>
                    </Pressable>
                  ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(period)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.progressTitle}>
              {period?.kind === 'week' ? t('periodWeekTitle') : t('periodMonthTitle')}
            </Text>
            <Text style={styles.modalPercent}>{period?.percent ?? 0}%</Text>
            <Text style={styles.emptyText}>
              {period ? motivation(period.motivationBucket, period.periodId) : ''}
            </Text>
            <Pressable style={styles.cta} onPress={() => void dismissPeriod()}>
              <Text style={styles.ctaText}>{t('dismiss')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ActivePlanHeroCard({
  plan,
  styles,
  colors,
  t,
  onPress,
  compact,
}: {
  plan: HomeActivePlanSummary;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useI18nTheme>['colors'];
  t: ReturnType<typeof useI18nTheme>['t'];
  onPress?: () => void;
  compact?: boolean;
}) {
  const body = (
    <>
      <View style={styles.heroTop}>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>{t('homePlanActive')}</Text>
        </View>
        {!compact ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        ) : null}
      </View>
      <Text style={styles.heroTitle} numberOfLines={2}>
        {plan.name}
      </Text>
      {plan.description ? (
        <Text style={styles.heroDesc} numberOfLines={compact ? 1 : 3}>
          {plan.description}
        </Text>
      ) : null}
      <View style={styles.heroProgressTrack}>
        <View
          style={[styles.heroProgressFill, { width: `${Math.min(100, plan.planCompletionPercent)}%` }]}
        />
      </View>
      <View style={styles.heroStats}>
        <Text style={styles.heroStat}>
          {t('homePlanProgress')}: {plan.planCompletionPercent}%
        </Text>
        <Text style={styles.heroStat}>
          {t('streak')}: {plan.streak}d
        </Text>
        <Text style={styles.heroStat}>
          {t('dailyProgress')}: {plan.dailyPercent}%
        </Text>
      </View>
      {!compact ? (
        <Text style={styles.heroHint}>{t('homeOpenPlan')}</Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={[styles.heroCard, compact && styles.heroCardCompact]} onPress={onPress}>
        {body}
      </Pressable>
    );
  }
  return <View style={[styles.heroCard, compact && styles.heroCardCompact]}>{body}</View>;
}

function MetricChip({
  icon,
  label,
  value,
  tint,
  styles,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint?: string;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useI18nTheme>['colors'];
}) {
  return (
    <View style={styles.metricChip}>
      <Ionicons name={icon} size={16} color={tint ?? colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    greeting: { ...typography.title, fontSize: 24, color: colors.text },
    date: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
      textTransform: 'capitalize',
    },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    backText: { ...typography.body, color: colors.primary, fontWeight: '600' },
    avatarBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 2,
      borderColor: colors.primary,
      gap: spacing.sm,
      ...shadows.card,
    },
    heroCardCompact: {
      borderWidth: 1,
      padding: spacing.md,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primaryMuted,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    activeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    activeBadgeText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    heroTitle: { ...typography.title, fontSize: 22, color: colors.text },
    heroDesc: { ...typography.body, color: colors.textMuted },
    heroProgressTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      overflow: 'hidden',
      marginTop: spacing.xs,
    },
    heroProgressFill: { height: '100%', backgroundColor: colors.primary },
    heroStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    heroStat: { ...typography.caption, color: colors.text, fontWeight: '600' },
    heroHint: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: 4 },
    switcherRow: { flexDirection: 'row', gap: spacing.sm },
    switcherChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    switcherChipOn: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    switcherText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
    switcherTextOn: { color: colors.primary },
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
    yesterdayCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadows.card,
    },
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
    fulfilledDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    fulfilledLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    fulfilledDividerText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    fulfilledCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.card,
    },
    addMoreBtn: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.primaryMuted,
    },
    addMoreText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
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
    achievementsLinkText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
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
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    modalPercent: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.primary,
      textAlign: 'center',
    },
  });
}
