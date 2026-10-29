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

import type { PlanOverview } from '../../../application/plans/planOverview';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootStackParamList } from '../../navigation/types';
import { radii, shadows, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PlanOverview'>;

export function PlanOverviewScreen() {
  const { getPlanOverview, markPlanOverviewSeen } = useUseCases();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors, t, motivation } = useI18nTheme();
  const [overview, setOverview] = useState<PlanOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlanOverview(route.params.planId);
      setOverview(data);
      if (data) {
        await markPlanOverviewSeen(route.params.planId);
      }
    } finally {
      setLoading(false);
    }
  }, [getPlanOverview, markPlanOverviewSeen, route.params.planId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (!overview) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>{t('error')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{overview.plan.name}</Text>
        <Text style={styles.subtitle}>{t('planOverviewTitle')}</Text>

        <View style={styles.hero}>
          <Text style={styles.percent}>{overview.successPercent}%</Text>
          <Text style={styles.heroLabel}>{t('overviewSuccess')}</Text>
          <Text style={styles.motivation}>
            {motivation(overview.motivationBucket, overview.plan.id)}
          </Text>
        </View>

        {overview.tasks.map((row) => (
          <View key={row.taskId} style={styles.row}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowMeta}>
              {t('overviewDone')}: {row.completed}/{row.expected} · {t('overviewMissed')}:{' '}
              {row.missed}
            </Text>
          </View>
        ))}

        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Tabs', { screen: 'Plans' })}
        >
          <Text style={styles.primaryBtnText}>{t('backToPlans')}</Text>
        </Pressable>
        <Pressable
          style={styles.outlineBtn}
          onPress={() => navigation.navigate('Tabs', { screen: 'CreatePlan' })}
        >
          <Text style={styles.outlineBtnText}>{t('createNewPlan')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    title: { ...typography.title, color: colors.text },
    subtitle: { ...typography.caption, color: colors.textMuted },
    hero: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      ...shadows.card,
    },
    percent: { fontSize: 48, fontWeight: '800', color: colors.primary },
    heroLabel: { ...typography.subtitle, color: colors.text },
    motivation: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
    row: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      ...shadows.card,
    },
    rowTitle: { ...typography.subtitle, color: colors.text },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    outlineBtn: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    outlineBtnText: { color: colors.primary, fontWeight: '700' },
  });
}
