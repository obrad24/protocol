import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ACTIVE_PLAN_LIMIT_CODE,
  ValidationError,
} from '../../../application/plans/createPlan';
import { isPlanExpired } from '../../../domain/entities/Plan';
import type { PlanListItem } from '../../../application/plans/listPlans';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { radii, shadows, spacing, typography } from '../../theme';
import { todayDateOnly } from '../../../shared/utils/date';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Plans'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function durationLabel(
  t: ReturnType<typeof useI18nTheme>['t'],
  duration: PlanListItem['duration'],
): string {
  switch (duration) {
    case 'weekly':
      return t('durationWeekly');
    case 'end_of_week':
      return t('durationEndOfWeek');
    case 'monthly':
      return t('durationMonthly');
    case 'end_of_month':
      return t('durationEndOfMonth');
    case 'multi_month':
      return t('durationMultiMonth');
    case 'custom':
      return t('durationCustom');
    case 'unlimited':
      return t('durationUnlimited');
    default:
      return duration;
  }
}

export function PlansScreen() {
  const {
    listPlans,
    setActivePlan,
    deactivatePlan,
    deletePlan,
    ensurePlanSummaries,
  } = useUseCases();
  const navigation = useNavigation<Nav>();
  const { colors, t } = useI18nTheme();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = todayDateOnly();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensurePlanSummaries();
      setPlans(await listPlans());
    } finally {
      setLoading(false);
    }
  }, [ensurePlanSummaries, listPlans]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onActivate = async (planId: string) => {
    setBusyId(planId);
    try {
      await setActivePlan(planId);
      await load();
    } catch (error) {
      if (error instanceof ValidationError && error.message === ACTIVE_PLAN_LIMIT_CODE) {
        Alert.alert(t('activePlanLimitTitle'), t('activePlanLimitBody'));
      } else {
        Alert.alert(t('error'), t('error'));
      }
    } finally {
      setBusyId(null);
    }
  };

  const onDeactivate = async (planId: string) => {
    setBusyId(planId);
    try {
      await deactivatePlan(planId);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (plan: PlanListItem) => {
    Alert.alert(t('deletePlanTitle'), t('deletePlanBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyId(plan.id);
            try {
              await deletePlan(plan.id);
              await load();
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('myPlans')}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : plans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('noPlansTitle')}</Text>
            <Text style={styles.emptyBody}>{t('noPlansBody')}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('CreatePlan')}>
              <Text style={styles.primaryBtnText}>{t('createFirstPlan')}</Text>
            </Pressable>
          </View>
        ) : (
          plans.map((plan) => {
            const expired = isPlanExpired(plan, today);
            return (
              <View key={plan.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{plan.name}</Text>
                  {plan.isActive ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('active')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.meta}>
                  {plan.duration === 'unlimited' || plan.endDate == null
                    ? durationLabel(t, 'unlimited')
                    : `${durationLabel(t, plan.duration)} · ${t('endsOn')} ${plan.endDate}`}
                </Text>
                {plan.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {plan.description}
                  </Text>
                ) : null}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, plan.completionPercent)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.percent}>{plan.completionPercent}%</Text>

                <View style={styles.actions}>
                  {!plan.isActive && !expired ? (
                    <Pressable
                      style={styles.outlineBtn}
                      disabled={busyId === plan.id}
                      onPress={() => void onActivate(plan.id)}
                    >
                      <Text style={styles.outlineBtnText}>{t('setActive')}</Text>
                    </Pressable>
                  ) : null}
                  {plan.isActive && !expired ? (
                    <Pressable
                      style={styles.outlineBtn}
                      disabled={busyId === plan.id}
                      onPress={() => void onDeactivate(plan.id)}
                    >
                      <Text style={styles.outlineBtnText}>{t('deactivate')}</Text>
                    </Pressable>
                  ) : null}
                  {expired ? (
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => navigation.navigate('PlanOverview', { planId: plan.id })}
                    >
                      <Text style={styles.outlineBtnText}>{t('viewOverview')}</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => navigation.navigate('EditPlan', { planId: plan.id })}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                      <Text style={styles.outlineBtnText}>{t('edit')}</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.dangerBtn} onPress={() => onDelete(plan)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.publicPlaceholder}>
          <Text style={styles.publicText}>{t('explorePublic')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    title: { ...typography.title, color: colors.text },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      ...shadows.card,
      gap: spacing.sm,
    },
    emptyTitle: { ...typography.subtitle, color: colors.text },
    emptyBody: { ...typography.body, color: colors.textMuted },
    primaryBtn: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      ...shadows.card,
      gap: spacing.xs,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { ...typography.subtitle, color: colors.text, flex: 1 },
    badge: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.pill,
    },
    badgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
    meta: { ...typography.caption, color: colors.textMuted },
    desc: { ...typography.body, color: colors.textMuted },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    progressFill: { height: '100%', backgroundColor: colors.primary },
    percent: { ...typography.caption, color: colors.text, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
    outlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    outlineBtnText: { color: colors.primary, fontWeight: '600' },
    dangerBtn: {
      marginLeft: 'auto',
      padding: spacing.sm,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    publicPlaceholder: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      alignItems: 'center',
    },
    publicText: { color: colors.textMuted },
  });
}
