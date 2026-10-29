import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import type {
  AppLocale,
  DailyReminderSettings,
  ThemePreference,
} from '../../../domain/entities/UserProfile';
import { DEFAULT_DAILY_REMINDERS } from '../../../domain/entities/UserProfile';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import { radii, shadows, spacing, typography } from '../../theme';

function parseTimeToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function SettingsScreen() {
  const { getProfile, updateSettings, syncDailyReminders } = useUseCases();
  const { colors, t, locale, themePreference, setLocale, setThemePreference, refreshFromProfile } =
    useI18nTheme();
  const [reminders, setReminders] = useState<DailyReminderSettings>({
    ...DEFAULT_DAILY_REMINDERS,
  });
  const [picking, setPicking] = useState<'time1' | 'time2' | null>(null);
  const [draftTime, setDraftTime] = useState(new Date());

  const load = useCallback(async () => {
    const profile = await getProfile();
    refreshFromProfile(profile);
    if (profile?.dailyReminders) {
      setReminders(profile.dailyReminders);
    }
  }, [getProfile, refreshFromProfile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const persistReminders = async (next: DailyReminderSettings) => {
    setReminders(next);
    await updateSettings({ dailyReminders: next });
    await syncDailyReminders();
    Alert.alert(t('settingsSaved'));
  };

  const onLocale = async (next: AppLocale) => {
    await setLocale(next);
    await syncDailyReminders();
    Alert.alert(t('settingsSaved'));
  };

  const onTheme = async (next: ThemePreference) => {
    await setThemePreference(next);
    Alert.alert(t('settingsSaved'));
  };

  const openPicker = (which: 'time1' | 'time2') => {
    setDraftTime(parseTimeToDate(which === 'time1' ? reminders.time1 : reminders.time2));
    setPicking(which);
  };

  const onAndroidTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    const which = picking;
    setPicking(null);
    if (!which || event.type !== 'set' || !selected) return;
    void persistReminders({
      ...reminders,
      [which]: formatTime(selected),
    });
  };

  const confirmIosTime = () => {
    if (!picking) return;
    const which = picking;
    setPicking(null);
    void persistReminders({
      ...reminders,
      [which]: formatTime(draftTime),
    });
  };

  const styles = makeStyles(colors);
  const locales: { value: AppLocale; label: string }[] = [
    { value: 'bs', label: t('languageBs') },
    { value: 'en', label: t('languageEn') },
  ];
  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('themeLight') },
    { value: 'dark', label: t('themeDark') },
    { value: 'system', label: t('themeSystem') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>{t('language')}</Text>
        <View style={styles.row}>
          {locales.map((item) => {
            const active = locale === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => void onLocale(item.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>{t('theme')}</Text>
        <View style={styles.row}>
          {themes.map((item) => {
            const active = themePreference === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => void onTheme(item.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>{t('dailyReminders')}</Text>
        <Text style={styles.hint}>{t('dailyRemindersHint')}</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('dailyRemindersEnabled')}</Text>
          <Switch
            value={reminders.enabled}
            onValueChange={(enabled) => void persistReminders({ ...reminders, enabled })}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={reminders.enabled ? colors.primary : colors.surface}
          />
        </View>

        {reminders.enabled ? (
          <>
            <Pressable style={styles.timeRow} onPress={() => openPicker('time1')}>
              <Text style={styles.switchLabel}>{t('reminderTime1')}</Text>
              <Text style={styles.timeValue}>{reminders.time1}</Text>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('reminderTime2Enabled')}</Text>
              <Switch
                value={reminders.time2Enabled}
                onValueChange={(time2Enabled) =>
                  void persistReminders({ ...reminders, time2Enabled })
                }
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={reminders.time2Enabled ? colors.primary : colors.surface}
              />
            </View>

            {reminders.time2Enabled ? (
              <Pressable style={styles.timeRow} onPress={() => openPicker('time2')}>
                <Text style={styles.switchLabel}>{t('reminderTime2')}</Text>
                <Text style={styles.timeValue}>{reminders.time2}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {picking && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draftTime}
          mode="time"
          is24Hour
          display="default"
          onChange={onAndroidTimeChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={Boolean(picking)} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setPicking(null)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.section}>{t('reminderPickTime')}</Text>
              <DateTimePicker
                value={draftTime}
                mode="time"
                display="spinner"
                onChange={(_e, selected) => {
                  if (selected) setDraftTime(selected);
                }}
              />
              <View style={styles.modalActions}>
                <Pressable onPress={() => setPicking(null)}>
                  <Text style={styles.modalCancel}>{t('cancel')}</Text>
                </Pressable>
                <Pressable onPress={confirmIosTime}>
                  <Text style={styles.modalDone}>{t('datePickerDone')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    section: { ...typography.subtitle, color: colors.text, marginTop: spacing.md },
    hint: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.sm },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
    chipText: { color: colors.textMuted, fontWeight: '600' },
    chipTextActive: { color: colors.primary },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      ...shadows.card,
    },
    switchLabel: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      ...shadows.card,
    },
    timeValue: { ...typography.subtitle, color: colors.primary },
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
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.lg,
      marginTop: spacing.sm,
    },
    modalCancel: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
    modalDone: { ...typography.body, color: colors.primary, fontWeight: '700' },
  });
}
