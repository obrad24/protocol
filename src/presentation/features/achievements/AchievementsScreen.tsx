import { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

import type { AchievementListItem } from '../../../application/achievements/listAchievements';
import type { AchievementCategory } from '../../../domain/entities/Achievement';
import { useUseCases } from '../../providers/AppProviders';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type Filter = 'all' | AchievementCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Sve' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'streak', label: 'Streak' },
  { value: 'plan', label: 'Plan' },
];

function iconFor(item: AchievementListItem): keyof typeof Ionicons.glyphMap {
  if (item.category === 'streak') return 'flame';
  if (item.category === 'plan') return 'ribbon';
  if (item.type.includes('week')) return 'calendar';
  if (item.type.includes('month')) return 'trophy';
  return 'star';
}

export function AchievementsScreen() {
  const { listAchievements } = useUseCases();
  const [items, setItems] = useState<AchievementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAchievements());
    } finally {
      setLoading(false);
    }
  }, [listAchievements]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.subtitle}>Osvojene i zaključane medalje</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {visible.map((item) => (
            <View
              key={item.type}
              style={[styles.card, !item.unlocked && styles.cardLocked]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: item.unlocked ? colors.primaryMuted : colors.border },
                ]}
              >
                <Ionicons
                  name={item.unlocked ? iconFor(item) : 'lock-closed'}
                  size={28}
                  color={item.unlocked ? colors.primary : colors.locked}
                />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              {item.unlocked ? (
                <View style={styles.unlockedRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.unlockedText}>Osvojeno</Text>
                </View>
              ) : (
                <Text style={styles.lockedText}>Zaključano</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filters: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  filterTextActive: { color: '#FFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  cardLocked: { opacity: 0.85 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.subtitle, fontSize: 15, color: colors.text },
  cardDesc: { ...typography.caption, color: colors.textMuted, marginTop: 4, minHeight: 48 },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  unlockedText: { color: colors.success, fontWeight: '600', fontSize: 12 },
  lockedText: { color: colors.locked, fontWeight: '600', fontSize: 12, marginTop: spacing.sm },
});
