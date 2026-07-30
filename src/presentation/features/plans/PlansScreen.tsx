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

import type { PlanListItem } from '../../../application/plans/listPlans';
import { useUseCases } from '../../providers/AppProviders';
import type { RootTabParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type Nav = BottomTabNavigationProp<RootTabParamList>;

function durationLabel(duration: PlanListItem['duration']): string {
  switch (duration) {
    case 'weekly':
      return 'Sedmični';
    case 'monthly':
      return 'Mjesečni';
    case 'multi_month':
      return 'Višemjesečni';
  }
}

export function PlansScreen() {
  const { listPlans, setActivePlan } = useUseCases();
  const navigation = useNavigation<Nav>();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await listPlans());
    } finally {
      setLoading(false);
    }
  }, [listPlans]);

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
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Moji planovi</Text>
        <Text style={styles.subtitle}>Pregled i aktivni plan</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {plans.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Još nema planova</Text>
              <Text style={styles.emptyText}>
                Kreiraj prvi plan preko centralnog + dugmeta.
              </Text>
              <Pressable style={styles.emptyCta} onPress={() => navigation.navigate('CreatePlan')}>
                <Text style={styles.emptyCtaText}>Kreiraj plan</Text>
              </Pressable>
            </View>
          ) : (
            plans.map((plan) => (
              <View key={plan.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planMeta}>{durationLabel(plan.duration)}</Text>
                  </View>
                  {plan.isActive ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Aktivan</Text>
                    </View>
                  ) : null}
                </View>

                {plan.description ? (
                  <Text style={styles.planDesc} numberOfLines={2}>
                    {plan.description}
                  </Text>
                ) : null}

                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${plan.completionPercent}%` }]}
                    />
                  </View>
                  <Text style={styles.percent}>{plan.completionPercent}%</Text>
                </View>

                {!plan.isActive ? (
                  <Pressable
                    style={styles.activateBtn}
                    disabled={busyId === plan.id}
                    onPress={() => void onActivate(plan.id)}
                  >
                    <Text style={styles.activateText}>
                      {busyId === plan.id ? 'Postavljam…' : 'Postavi kao aktivan'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}

          <View style={styles.explorePlaceholder}>
            <Text style={styles.exploreTitle}>Istraži javne planove</Text>
            <Text style={styles.exploreText}>Uskoro — pretraga planova drugih korisnika.</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xxl },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  emptyTitle: { ...typography.subtitle, color: colors.text },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  emptyCta: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyCtaText: { color: '#FFF', fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  planName: { ...typography.subtitle, color: colors.text },
  planMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  planDesc: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  activeBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  activeBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  percent: { ...typography.caption, color: colors.text, fontWeight: '700', minWidth: 36 },
  activateBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  activateText: { color: colors.primary, fontWeight: '600' },
  explorePlaceholder: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.lg,
  },
  exploreTitle: { ...typography.subtitle, color: colors.textMuted },
  exploreText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
