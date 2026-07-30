import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { PlanDuration } from '../../../domain/entities/Plan';
import type { RecurrenceRule, Weekday } from '../../../domain/value-objects/RecurrenceRule';
import { ValidationError } from '../../../application/plans/createPlan';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useUseCases } from '../../providers/AppProviders';
import type { RootTabParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type DraftTask = {
  key: string;
  title: string;
  recurrence: RecurrenceRule;
};

type Nav = BottomTabNavigationProp<RootTabParamList>;

const DURATIONS: { value: PlanDuration; label: string }[] = [
  { value: 'weekly', label: 'Sedmični' },
  { value: 'monthly', label: 'Mjesečni' },
  { value: 'multi_month', label: 'Višemjesečni' },
];

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Uto' },
  { value: 3, label: 'Sri' },
  { value: 4, label: 'Čet' },
  { value: 5, label: 'Pet' },
  { value: 6, label: 'Sub' },
  { value: 7, label: 'Ned' },
];

function newTask(): DraftTask {
  return {
    key: `draft_${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    recurrence: { type: 'daily' },
  };
}

export function CreatePlanScreen() {
  const { createPlan } = useUseCases();
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<PlanDuration>('weekly');
  const [tasks, setTasks] = useState<DraftTask[]>([newTask()]);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && tasks.some((t) => t.title.trim().length > 0),
    [name, tasks],
  );

  const updateTask = (key: string, patch: Partial<DraftTask>) => {
    setTasks((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  };

  const setRecurrenceType = (key: string, type: RecurrenceRule['type']) => {
    let recurrence: RecurrenceRule;
    switch (type) {
      case 'daily':
        recurrence = { type: 'daily' };
        break;
      case 'weekly_count':
        recurrence = { type: 'weekly_count', timesPerWeek: 3 };
        break;
      case 'weekdays':
        recurrence = { type: 'weekdays', days: [1, 3, 5] };
        break;
      case 'monthly_count':
        recurrence = { type: 'monthly_count', timesPerMonth: 4 };
        break;
    }
    updateTask(key, { recurrence });
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      await createPlan({
        name,
        description,
        duration,
        setAsActive: true,
        tasks: tasks
          .filter((t) => t.title.trim())
          .map((t) => ({ title: t.title, recurrence: t.recurrence })),
      });
      setName('');
      setDescription('');
      setDuration('weekly');
      setTasks([newTask()]);
      Alert.alert('Plan kreiran', 'Plan je sačuvan i postavljen kao aktivan.');
      navigation.navigate('Plans');
    } catch (error) {
      const message =
        error instanceof ValidationError ? error.message : 'Nije moguće kreirati plan.';
      Alert.alert('Greška', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Kreiraj plan</Text>

        <Text style={styles.label}>Naziv</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="npr. Jutarnja rutina"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Opis</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Kratki opis plana"
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={styles.label}>Trajanje</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => {
            const active = duration === d.value;
            return (
              <Pressable
                key={d.value}
                onPress={() => setDuration(d.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Zadaci</Text>
          <Pressable onPress={() => setTasks((prev) => [...prev, newTask()])} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addBtnText}>Dodaj</Text>
          </Pressable>
        </View>

        {tasks.map((task, index) => {
          const recurrence = task.recurrence;
          return (
          <View key={task.key} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskIndex}>Zadatak {index + 1}</Text>
              {tasks.length > 1 ? (
                <Pressable
                  onPress={() => setTasks((prev) => prev.filter((t) => t.key !== task.key))}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              value={task.title}
              onChangeText={(title) => updateTask(task.key, { title })}
              placeholder="Naziv zadatka"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Ponavljanje</Text>
            <View style={styles.chipRow}>
              {(
                [
                  ['daily', 'Svaki dan'],
                  ['weekly_count', 'X / sedmica'],
                  ['weekdays', 'Dani'],
                  ['monthly_count', 'X / mjesec'],
                ] as const
              ).map(([type, label]) => {
                const active = recurrence.type === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setRecurrenceType(task.key, type)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {recurrence.type === 'weekly_count' ? (
              <View style={styles.counterRow}>
                <Text style={styles.meta}>Puta sedmično</Text>
                <View style={styles.counterControls}>
                  <Pressable
                    onPress={() =>
                      updateTask(task.key, {
                        recurrence: {
                          type: 'weekly_count',
                          timesPerWeek: Math.max(1, recurrence.timesPerWeek - 1),
                        },
                      })
                    }
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </Pressable>
                  <Text style={styles.counterValue}>{recurrence.timesPerWeek}</Text>
                  <Pressable
                    onPress={() =>
                      updateTask(task.key, {
                        recurrence: {
                          type: 'weekly_count',
                          timesPerWeek: Math.min(7, recurrence.timesPerWeek + 1),
                        },
                      })
                    }
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {recurrence.type === 'monthly_count' ? (
              <View style={styles.counterRow}>
                <Text style={styles.meta}>Puta mjesečno</Text>
                <View style={styles.counterControls}>
                  <Pressable
                    onPress={() =>
                      updateTask(task.key, {
                        recurrence: {
                          type: 'monthly_count',
                          timesPerMonth: Math.max(1, recurrence.timesPerMonth - 1),
                        },
                      })
                    }
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </Pressable>
                  <Text style={styles.counterValue}>{recurrence.timesPerMonth}</Text>
                  <Pressable
                    onPress={() =>
                      updateTask(task.key, {
                        recurrence: {
                          type: 'monthly_count',
                          timesPerMonth: Math.min(31, recurrence.timesPerMonth + 1),
                        },
                      })
                    }
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {recurrence.type === 'weekdays' ? (
              <View style={styles.chipRow}>
                {WEEKDAY_OPTIONS.map((day) => {
                  const selected = recurrence.days.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      onPress={() => {
                        const days = selected
                          ? recurrence.days.filter((d: Weekday) => d !== day.value)
                          : [...recurrence.days, day.value].sort((a, b) => a - b);
                        updateTask(task.key, {
                          recurrence: {
                            type: 'weekdays',
                            days: (days.length ? days : [day.value]) as Weekday[],
                          },
                        });
                      }}
                      style={[styles.dayChip, selected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
          );
        })}

        <PrimaryButton
          label="Sačuvaj plan"
          onPress={onSubmit}
          loading={saving}
          disabled={!canSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.subtitle, color: colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: colors.primary, fontWeight: '600' },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  taskIndex: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  counterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { ...typography.body, color: colors.text },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: { ...typography.subtitle, color: colors.text, minWidth: 24, textAlign: 'center' },
});
