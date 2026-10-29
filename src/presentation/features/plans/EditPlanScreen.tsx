import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { ValidationError } from '../../../application/plans/createPlan';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootStackParamList } from '../../navigation/types';
import {
  PlanFormEditor,
  newDraftTask,
  type DraftTask,
  type PlanFormValues,
} from '../create-plan/PlanFormEditor';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditPlan'>;

export function EditPlanScreen() {
  const { getPlan, updatePlan } = useUseCases();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors, t } = useI18nTheme();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<{
    name: string;
    description: string;
    duration: PlanFormValues['duration'];
    customEndDate: string;
    tasks: DraftTask[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plan = await getPlan(route.params.planId);
      if (!plan) {
        Alert.alert(t('error'), 'Plan nije pronađen.');
        navigation.goBack();
        return;
      }
      setInitial({
        name: plan.name,
        description: plan.description,
        duration: plan.duration,
        customEndDate:
          plan.duration === 'custom' && plan.endDate ? plan.endDate : '',
        tasks: plan.tasks.map((task) => ({
          key: task.id,
          title: task.title,
          description: task.description ?? '',
          recurrence: task.recurrence,
          allowOverPlan: task.allowOverPlan === true,
        })),
      });
    } finally {
      setLoading(false);
    }
  }, [getPlan, navigation, route.params.planId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const persist = async (values: PlanFormValues) => {
    setSaving(true);
    try {
      await updatePlan({
        planId: route.params.planId,
        name: values.name,
        description: values.description,
        duration: values.duration,
        customEndDate: values.customEndDate,
        tasks: values.tasks,
      });
      Alert.alert(t('planUpdatedTitle'), t('planUpdatedBody'));
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof ValidationError ? error.message : t('updatePlanError');
      Alert.alert(t('error'), message);
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (values: PlanFormValues) => {
    Alert.alert(t('editRestartTitle'), t('editRestartBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('continue'), style: 'destructive', onPress: () => void persist(values) },
    ]);
  };

  if (loading || !initial) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <PlanFormEditor
        title={t('editPlanTitle')}
        submitLabel={t('saveChanges')}
        initial={initial.tasks.length ? initial : { ...initial, tasks: [newDraftTask()] }}
        saving={saving}
        onSubmit={onSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
