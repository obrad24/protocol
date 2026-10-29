import { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import type { PlanDuration } from '../../../domain/entities/Plan';
import { TASK_DESCRIPTION_MAX_LENGTH } from '../../../domain/entities/Task';
import type { RecurrenceRule, Weekday } from '../../../domain/value-objects/RecurrenceRule';
import type { CreatePlanTaskInput } from '../../../application/plans/createPlan';
import {
  defaultPlanStartDate,
  isValidDateOnly,
} from '../../../shared/utils/planDates';
import { formatDateOnly, parseDateOnly } from '../../../shared/utils/date';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import { radii, shadows, spacing, typography } from '../../theme';

export type DraftTask = {
  key: string;
  title: string;
  description: string;
  recurrence: RecurrenceRule;
  allowOverPlan: boolean;
};

export type PlanFormValues = {
  name: string;
  description: string;
  duration: PlanDuration;
  customEndDate: string;
  tasks: CreatePlanTaskInput[];
};

type Props = {
  title: string;
  submitLabel: string;
  initial?: Partial<{
    name: string;
    description: string;
    duration: PlanDuration;
    customEndDate: string;
    tasks: DraftTask[];
  }>;
  saving: boolean;
  onSubmit: (values: PlanFormValues) => void;
};

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Uto' },
  { value: 3, label: 'Sri' },
  { value: 4, label: 'Čet' },
  { value: 5, label: 'Pet' },
  { value: 6, label: 'Sub' },
  { value: 7, label: 'Ned' },
];

export function newDraftTask(): DraftTask {
  return {
    key: `draft_${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    description: '',
    recurrence: { type: 'daily' },
    allowOverPlan: false,
  };
}

function resolvePickerDate(dateOnly: string, minimum: Date): Date {
  if (isValidDateOnly(dateOnly)) {
    const parsed = parseDateOnly(dateOnly);
    return parsed < minimum ? minimum : parsed;
  }
  return minimum;
}

function formatDisplayDate(dateOnly: string, locale: string): string {
  if (!isValidDateOnly(dateOnly)) return '';
  const date = parseDateOnly(dateOnly);
  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'bs-BA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PlanFormEditor({ title, submitLabel, initial, saving, onSubmit }: Props) {
  const { colors, t, locale, isDark } = useI18nTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [duration, setDuration] = useState<PlanDuration>(initial?.duration ?? 'weekly');
  const [customEndDate, setCustomEndDate] = useState(initial?.customEndDate ?? '');
  const [tasks, setTasks] = useState<DraftTask[]>(initial?.tasks?.length ? initial.tasks : [newDraftTask()]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<Date>(() =>
    resolvePickerDate(initial?.customEndDate ?? '', parseDateOnly(defaultPlanStartDate())),
  );

  const planStartMinimum = parseDateOnly(defaultPlanStartDate());

  useEffect(() => {
    if (!initial) return;
    if (initial.name !== undefined) setName(initial.name);
    if (initial.description !== undefined) setDescription(initial.description);
    if (initial.duration !== undefined) setDuration(initial.duration);
    if (initial.customEndDate !== undefined) {
      setCustomEndDate(initial.customEndDate);
      setPickerDraft(resolvePickerDate(initial.customEndDate, parseDateOnly(defaultPlanStartDate())));
    }
    if (initial.tasks?.length) setTasks(initial.tasks);
  }, [initial?.name, initial?.description, initial?.duration, initial?.customEndDate]);

  const durations: { value: PlanDuration; label: string }[] = [
    { value: 'end_of_week', label: t('durationEndOfWeek') },
    { value: 'weekly', label: t('durationWeekly') },
    { value: 'end_of_month', label: t('durationEndOfMonth') },
    { value: 'monthly', label: t('durationMonthly') },
    { value: 'multi_month', label: t('durationMultiMonth') },
    { value: 'custom', label: t('durationCustom') },
    { value: 'unlimited', label: t('durationUnlimited') },
  ];

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      tasks.some((task) => task.title.trim().length > 0) &&
      (duration !== 'custom' || isValidDateOnly(customEndDate.trim())),
    [name, tasks, duration, customEndDate],
  );

  const openDatePicker = () => {
    const minimum = parseDateOnly(defaultPlanStartDate());
    setPickerDraft(resolvePickerDate(customEndDate, minimum));
    setDatePickerOpen(true);
  };

  const commitDate = (date: Date) => {
    const minimum = parseDateOnly(defaultPlanStartDate());
    const next = date < minimum ? minimum : date;
    setCustomEndDate(formatDateOnly(next));
    setPickerDraft(next);
  };

  const onAndroidDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setDatePickerOpen(false);
    if (event.type === 'set' && selected) {
      commitDate(selected);
    }
  };

  const onIosDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setPickerDraft(selected);
  };

  const confirmIosDate = () => {
    commitDate(pickerDraft);
    setDatePickerOpen(false);
  };

  const updateTask = (key: string, patch: Partial<DraftTask>) => {
    setTasks((prev) => prev.map((task) => (task.key === key ? { ...task, ...patch } : task)));
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

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.label}>{t('planName')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('planNamePlaceholder')}
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>{t('planDescription')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('planDescriptionPlaceholder')}
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Text style={styles.label}>{t('duration')}</Text>
      <View style={styles.chipRow}>
        {durations.map((item) => {
          const active = duration === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setDuration(item.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {duration === 'custom' ? (
        <>
          <Text style={styles.label}>{t('customEndDate')}</Text>
          <Pressable
            onPress={openDatePicker}
            style={styles.dateField}
            accessibilityRole="button"
            accessibilityLabel={t('customEndDate')}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text
              style={[
                styles.dateFieldText,
                !customEndDate && styles.dateFieldPlaceholder,
              ]}
            >
              {customEndDate
                ? formatDisplayDate(customEndDate, locale)
                : t('customEndDatePlaceholder')}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>

          {datePickerOpen && Platform.OS === 'android' ? (
            <DateTimePicker
              value={pickerDraft}
              mode="date"
              display="calendar"
              minimumDate={planStartMinimum}
              onChange={onAndroidDateChange}
            />
          ) : null}

          {Platform.OS === 'ios' ? (
            <Modal
              visible={datePickerOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setDatePickerOpen(false)}
            >
              <Pressable
                style={styles.dateModalOverlay}
                onPress={() => setDatePickerOpen(false)}
              >
                <Pressable
                  style={styles.dateModalCard}
                  onPress={(event) => event.stopPropagation()}
                >
                  <Text style={styles.dateModalTitle}>{t('customEndDate')}</Text>
                  <DateTimePicker
                    value={pickerDraft}
                    mode="date"
                    display="inline"
                    minimumDate={planStartMinimum}
                    onChange={onIosDateChange}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.iosPicker}
                  />
                  <View style={styles.dateModalActions}>
                    <Pressable
                      onPress={() => setDatePickerOpen(false)}
                      style={styles.dateModalBtn}
                    >
                      <Text style={styles.dateModalBtnMuted}>{t('cancel')}</Text>
                    </Pressable>
                    <Pressable onPress={confirmIosDate} style={styles.dateModalBtn}>
                      <Text style={styles.dateModalBtnPrimary}>{t('datePickerDone')}</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          ) : null}
        </>
      ) : null}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{t('tasks')}</Text>

      {tasks.map((task, index) => {
        const recurrence = task.recurrence;
        return (
          <View key={task.key} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskIndex}>
                {t('tasks')} {index + 1}
              </Text>
              {tasks.length > 1 ? (
                <Pressable onPress={() => setTasks((prev) => prev.filter((row) => row.key !== task.key))}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              value={task.title}
              onChangeText={(titleValue) => updateTask(task.key, { title: titleValue })}
              placeholder={t('taskTitle')}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>{t('taskDescription')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={task.description}
              onChangeText={(descriptionValue) =>
                updateTask(task.key, {
                  description: descriptionValue.slice(0, TASK_DESCRIPTION_MAX_LENGTH),
                })
              }
              placeholder={t('taskDescriptionHint')}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
            />
            <Text style={styles.hint}>
              {task.description.length}/{TASK_DESCRIPTION_MAX_LENGTH}
            </Text>

            <Text style={styles.label}>{t('recurrence')}</Text>
            <View style={styles.chipRow}>
              {(
                [
                  ['daily', t('recurrenceDaily')],
                  ['weekly_count', t('recurrenceWeeklyCount')],
                  ['weekdays', t('recurrenceWeekdays')],
                  ['monthly_count', t('recurrenceMonthlyCount')],
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
                <Text style={styles.meta}>{t('recurrenceWeeklyCount')}</Text>
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
                <Text style={styles.meta}>{t('recurrenceMonthlyCount')}</Text>
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

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.meta}>{t('allowOverPlan')}</Text>
                <Text style={styles.hint}>{t('allowOverPlanHint')}</Text>
              </View>
              <Switch
                value={task.allowOverPlan}
                onValueChange={(allowOverPlan) => updateTask(task.key, { allowOverPlan })}
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={task.allowOverPlan ? colors.primary : colors.surface}
              />
            </View>
          </View>
        );
      })}

      <Pressable
        onPress={() => setTasks((prev) => [...prev, newDraftTask()])}
        style={styles.addBelow}
      >
        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        <Text style={styles.addBelowText}>{t('addTaskBelow')}</Text>
      </Pressable>

      <PrimaryButton
        label={submitLabel}
        onPress={() =>
          onSubmit({
            name,
            description,
            duration,
            customEndDate,
            tasks: tasks
              .filter((task) => task.title.trim())
              .map((task) => ({
                title: task.title,
                description: task.description,
                recurrence: task.recurrence,
                allowOverPlan: task.allowOverPlan,
              })),
          })
        }
        loading={saving}
        disabled={!canSubmit}
      />
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    title: { ...typography.title, color: colors.text, marginBottom: spacing.md },
    label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
    hint: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end' },
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
    dateField: {
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dateFieldText: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    dateFieldPlaceholder: { color: colors.textMuted },
    dateModalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    dateModalCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      ...shadows.card,
    },
    dateModalTitle: {
      ...typography.subtitle,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    iosPicker: { alignSelf: 'center' },
    dateModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    dateModalBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
    dateModalBtnMuted: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
    dateModalBtnPrimary: { ...typography.body, color: colors.primary, fontWeight: '700' },
    textArea: { minHeight: 72, textAlignVertical: 'top' },
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
    sectionTitle: { ...typography.subtitle, color: colors.text },
    taskCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.md,
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
    counterValue: {
      ...typography.subtitle,
      color: colors.text,
      minWidth: 24,
      textAlign: 'center',
    },
    switchRow: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    addBelow: {
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.primaryMuted,
    },
    addBelowText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  });
}
