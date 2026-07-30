# Changelog — Protocol

Format: [Keep a Changelog](https://keepachangelog.com/).  
Verzije prate smisao proizvoda; dok nema store release-a, koristimo `0.x.y`.

---

## [Unreleased]

### Added

- EAS Build setup za Android APK (`eas.json` preview profil)
- `android.package`: `com.protocol.app`
- Skripta `npm run build:apk`
- [docs/ANDROID_APK.md](./ANDROID_APK.md) — upute za login, build i instalaciju
- [docs/PLAY_STORE.md](./PLAY_STORE.md) — task checklist za Google Play Store
- `react-native-gesture-handler` (fix crash-a standalone APK pri startu)

### Fixed

- APK crash on launch: dodan gesture-handler import + `GestureHandlerRootView` (React Navigation)

### Planned

- Faza 11+ (javni planovi, auth/sync, push) — van v1

---

## [0.5.0] — 2026-07-28

### Added

- Sedmični mini bar chart na Home
- Stats ekran: Sedmica/Mjesec, KPI, chart, consistency grid, najbolje navike
- `AnalyticsCalculator` + `getStatsDashboard` use case
- Filter chipovi na Achievements

### Changed

- Validacija praznog imena na profilu
- Dokumentacija (TASKS / ROADMAP / ARCHITECTURE) usklađena sa v1 završetkom

---

## [0.4.0] — 2026-07-28

### Added

- Lokalna persistencija (AsyncStorage) + `KeyValueStore` abstrakcija
- Repository implementacije: Profile, Plan, Completion, Achievement
- Composition root (`createAppContainer`) + `AppProviders`
- Use cases: profil, create/list/setActive plan, home dashboard, toggle completion, achievements + unlock
- Profile UI (ime, avatar via image picker, član od)
- Create Plan UI (trajanje + sva recurrence pravila)
- My Plans UI (kartice, %, aktivan, explore placeholder)
- Home UI (pozdrav, circular progress, metrike, checklist, aktivni plan)
- Achievements stack ekran (osvojene / zaključane)
- `react-native-svg`, `expo-image-picker`, `@react-navigation/native-stack`

### Changed

- Root navigacija: Stack (Tabs + Achievements) umjesto samo tabova

---

## [0.3.1] — 2026-07-28

### Added

- `docs/DESIGN.md` — UI smjer iz mockupa
- Reference slike u `docs/references/`
- Stats placeholder ekran
- Zahtjevi za Stats (FR-STATS-*) i ažuriran Home / navigacija

### Changed

- Bottom nav: **Home · Plans · + · Stats · Profile** (Achievements više nije tab)
- Theme: ljubičasti primary (`#6C5CE7`), success/streak tokeni, card shadows
- Centralni Create tab kao elevated + dugme

---

## [0.3.0] — 2026-07-28

### Added

- Domain entiteti: `UserProfile`, `Plan`, `Task`, `TaskCompletion`, `Achievement`
- `RecurrenceRule` value object + validacija
- Repository portovi: Plan, Completion, Profile, Achievement
- Policies: `ProgressCalculator`, `StreakCalculator`, `AchievementEvaluator`
- Shared date utils (`src/shared/utils/date.ts`)
- Unit testovi (11) — `npm test` (tsx + node:test)

### Changed

- Fiksiran streak uslov u REQUIREMENTS: 100% dnevnog progresa

---

## [0.2.0] — 2026-07-28

### Added

- React Navigation bottom tabs (5 sekcija: Home, Create Plan, My Plans, Achievements, Profile)
- `src/` clean-architecture skeleton (domain, application, data, presentation, shared)
- Theme (`colors`, `spacing`, `typography`, `radii`)
- Placeholder ekrani za sve tabove
- Zavisnosti: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `@expo/vector-icons`

### Changed

- `App.tsx` sada učitava `SafeAreaProvider` + `NavigationContainer` + `RootTabs`

---

## [0.1.0] — 2026-07-28

### Added

- Expo (SDK 54) + React Native + TypeScript projekat
- Početni `App.tsx` ekran (Protocol / Praćenje zadataka)
- `.nvmrc` (Node 22)
- Dokumentacija u `docs/`:
  - `README.md` — indeks dokumentacije
  - `REQUIREMENTS.md` — funkcionalni i nefunkcionalni zahtjevi
  - `ARCHITECTURE.md` — clean architecture i ciljna struktura
  - `TASKS.md` — plan implementacije sa checkboxima
  - `ROADMAP.md` — faze i prioriteti
  - `CHANGELOG.md` — ovaj fajl
- Root `README.md` sa uputama za pokretanje

### Changed

- Downgrade sa Expo SDK 57 na **SDK 54** radi kompatibilnosti sa Expo Go iz prodavnice
