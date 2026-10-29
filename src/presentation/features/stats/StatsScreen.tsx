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

import type { PlanListItem } from '../../../application/plans/listPlans';
import { isPlanExpired } from '../../../domain/entities/Plan';
import { todayDateOnly } from '../../../shared/utils/date';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { radii, shadows, spacing, typography } from '../../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Stats'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function StatsScreen() {
  const { listPlans } = useUseCases();
  const navigation = useNavigation<Nav>();
  const { colors, t } = useI18nTheme();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayDateOnly();

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

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('statsTitle')}</Text>
        <Text style={styles.subtitle}>{t('statsPickPlan')}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('statsNoPlans')}</Text>
            <Pressable style={styles.cta} onPress={() => navigation.navigate('CreatePlan')}>
              <Text style={styles.ctaText}>{t('createFirstPlan')}</Text>
            </Pressable>
          </View>
        ) : (
          plans.map((plan) => {
            const expired = isPlanExpired(plan, today);
            return (
              <Pressable
                key={plan.id}
                style={styles.card}
                onPress={() => navigation.navigate('PlanStats', { planId: plan.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {plan.name}
                  </Text>
                  {plan.isActive && !expired ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('active')}</Text>
                    </View>
                  ) : null}
                </View>
                {plan.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {plan.description}
                  </Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <Text style={styles.percent}>{plan.completionPercent}%</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    title: { ...typography.title, color: colors.text },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: -spacing.sm },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      ...shadows.card,
      gap: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    cardTitle: { ...typography.subtitle, color: colors.text, flex: 1 },
    badge: {
      backgroundColor: colors.primaryMuted,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    badgeText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    desc: { ...typography.body, color: colors.textMuted },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    percent: { ...typography.subtitle, fontSize: 14, color: colors.primary },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      ...shadows.card,
    },
    emptyTitle: { ...typography.subtitle, color: colors.text },
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
