import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import {
  ACTIVE_PLAN_LIMIT_CODE,
  ValidationError,
} from '../../../application/plans/createPlan';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import type { RootTabParamList } from '../../navigation/types';
import { PlanFormEditor, type PlanFormValues } from './PlanFormEditor';

type Nav = BottomTabNavigationProp<RootTabParamList>;

export function CreatePlanScreen() {
  const { createPlan } = useUseCases();
  const navigation = useNavigation<Nav>();
  const { colors, t } = useI18nTheme();
  const [saving, setSaving] = useState(false);

  const onSubmit = async (values: PlanFormValues) => {
    setSaving(true);
    try {
      await createPlan({
        name: values.name,
        description: values.description,
        duration: values.duration,
        customEndDate: values.customEndDate,
        setAsActive: true,
        tasks: values.tasks,
      });
      Alert.alert(t('planCreatedTitle'), t('planCreatedBody'));
      navigation.navigate('Plans');
    } catch (error) {
      if (error instanceof ValidationError && error.message === ACTIVE_PLAN_LIMIT_CODE) {
        Alert.alert(t('activePlanLimitTitle'), t('activePlanLimitBody'));
      } else {
        const message =
          error instanceof ValidationError ? error.message : t('createPlanError');
        Alert.alert(t('error'), message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <PlanFormEditor
        title={t('createPlanTitle')}
        submitLabel={t('savePlan')}
        saving={saving}
        onSubmit={onSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
