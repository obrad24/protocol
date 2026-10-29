import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { UserProfile } from '../../../domain/entities/UserProfile';
import { ProfileValidationError } from '../../../application/profile/profileUseCases';
import { useUseCases } from '../../providers/AppProviders';
import { useI18nTheme } from '../../i18n/I18nThemeProvider';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { radii, spacing, typography, shadows } from '../../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const { getProfile, updateProfile } = useUseCases();
  const navigation = useNavigation<Nav>();
  const { colors, t } = useI18nTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      if (!data) return;
      setProfile(data);
      setName(data.displayName);
    } finally {
      setLoading(false);
    }
  }, [getProfile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ displayName: name });
      setProfile(updated);
      setName(updated.displayName);
      Alert.alert(t('save'), t('settingsSaved'));
    } catch (error) {
      const message =
        error instanceof ProfileValidationError
          ? error.message
          : t('error');
      Alert.alert(t('error'), message);
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Dozvola', 'Potreban je pristup galeriji za sliku profila.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setSaving(true);
    try {
      const updated = await updateProfile({ avatarUri: result.assets[0].uri });
      setProfile(updated);
    } catch {
      Alert.alert(t('error'), t('error'));
    } finally {
      setSaving(false);
    }
  };

  const styles = makeStyles(colors);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const createdLabel = new Date(profile.createdAt).toLocaleDateString('bs-BA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('profileTitle')}</Text>

        <View style={styles.card}>
          <Pressable onPress={onPickAvatar} style={styles.avatarWrap}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={36} color={colors.primary} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </Pressable>

          <Text style={styles.label}>{t('nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('nameLabel')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.metaLabel}>{t('memberSince')}</Text>
          <Text style={styles.metaValue}>{createdLabel}</Text>
        </View>

        <PrimaryButton label={t('saveProfile')} onPress={onSave} loading={saving} />

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
          <Text style={styles.linkText}>{t('settingsLink')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Achievements')}>
          <Ionicons name="trophy-outline" size={20} color={colors.primary} />
          <Text style={styles.linkText}>{t('achievementsLink')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useI18nTheme>['colors']) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.lg,
    },
    title: {
      ...typography.title,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      ...shadows.card,
    },
    avatarWrap: {
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.lg,
      backgroundColor: colors.background,
    },
    metaLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    metaValue: {
      ...typography.body,
      color: colors.text,
      marginTop: spacing.xs,
    },
    linkRow: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      ...shadows.card,
    },
    linkText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
  });
}
