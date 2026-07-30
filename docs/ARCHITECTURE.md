# Arhitektura — Protocol

Ažuriraj ovaj dokument svaki put kad se promijeni struktura foldera, moduli ili tok podataka.

---

## 1. Ciljevi

- **Clean Architecture** — zavisnosti ka unutra (UI → application → domain ← data)
- **Modularnost** — feature moduli (home, plans, achievements, profile)
- **Proširivost** — novi tipovi ponavljanja, medalja ili sync bez rušenja domena

---

## 2. Slojevi

```
┌─────────────────────────────────────────┐
│  Presentation (UI)                      │
│  screens, components, navigation, hooks │
├─────────────────────────────────────────┤
│  Application (use cases)                │
│  CreatePlan, ToggleTask, GetHomeFeed…   │
├─────────────────────────────────────────┤
│  Domain                                 │
│  entities, value objects, policies      │
│  (progress, streak, achievements)       │
├─────────────────────────────────────────┤
│  Data                                   │
│  repositories (impl), mappers, storage  │
└─────────────────────────────────────────┘
```

### Pravila zavisnosti

| Sloj | Smije zavisiti od |
|------|-------------------|
| Domain | ničega van domain-a |
| Application | Domain |
| Data | Domain (implementira portove/interfejse) |
| Presentation | Application (+ Domain tipovi po potrebi) |

React Native / Expo API-ji žive u **Presentation** i **Data** (storage), nikad u Domain.

---

## 3. Predložena struktura foldera

> Status: **ciljna** struktura (projekat trenutno ima Expo blank template). Ažurirati „Status implementacije“ kako se folderi dodaju.

```
Protocol/
├── App.tsx                          # entry → SafeAreaProvider + NavigationContainer
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Plan.ts
│   │   │   ├── Task.ts
│   │   │   ├── UserProfile.ts
│   │   │   └── Achievement.ts
│   │   ├── value-objects/
│   │   │   └── RecurrenceRule.ts
│   │   ├── policies/
│   │   │   ├── ProgressCalculator.ts
│   │   │   ├── StreakCalculator.ts
│   │   │   └── AchievementEvaluator.ts
│   │   └── repositories/            # interfejsi (portovi)
│   │       ├── PlanRepository.ts
│   │       ├── CompletionRepository.ts
│   │       ├── ProfileRepository.ts
│   │       └── AchievementRepository.ts
│   ├── application/
│   │   ├── plans/
│   │   ├── home/
│   │   ├── achievements/
│   │   └── profile/
│   ├── data/
│   │   ├── storage/                 # AsyncStorage / SQLite
│   │   ├── mappers/
│   │   └── repositories/            # implementacije
│   ├── presentation/
│   │   ├── components/              # dijeljeni UI
│   │   ├── features/
│   │   │   ├── home/
│   │   │   ├── create-plan/
│   │   │   ├── plans/
│   │   │   ├── achievements/
│   │   │   └── profile/
│   │   ├── navigation/
│   │   └── theme/
│   └── shared/
│       ├── types/
│       ├── utils/                   # datumi, formatiranje
│       └── constants/
├── docs/
└── assets/
```

### Status implementacije (ažurirati)

| Modul | Status |
|-------|--------|
| Expo blank + TypeScript | ✅ postoji |
| Navigacija (tabs) | ✅ Home · Plans · + · Stats · Profile (FAB center) |
| `src/` skeleton | ✅ domain / application / data / presentation / shared |
| Theme | ✅ ljubičasti accent po DESIGN.md |
| Feature ekrani | ✅ placeholderi (+ Stats); Achievements van tabova |
| Design spec | ✅ `docs/DESIGN.md` + reference slike |
| Domain entiteti + VO + repository portovi | ✅ |
| Domain policies + unit testovi | ✅ Progress / Streak / Achievements |
| Data (AsyncStorage repos + DI) | ✅ |
| Application use cases | ✅ |
| Profile / Create Plan / Plans / Home / Achievements UI | ✅ MVP |
| Stats UI | ✅ Sedmica/Mjesec + chart + habits |
| v1 taskovi (Faza 0–10) | ✅ Gotovo |

---

## 4. Ključni domain koncepti

### RecurrenceRule

```ts
type RecurrenceRule =
  | { type: 'daily' }
  | { type: 'weekly_count'; timesPerWeek: number }
  | { type: 'weekdays'; days: Weekday[] }  // 0=Sun … 6=Sat ili Pon–Ned dogovor
  | { type: 'monthly_count'; timesPerMonth: number };
```

### PlanDuration

```ts
type PlanDuration = 'weekly' | 'monthly' | 'multi_month';
```

### Progress

Izračun u **domain policies** (čiste funkcije):

- ulaz: plan + tasks + completions + referentni datum  
- izlaz: `{ daily, weekly, monthly, planCompletionPercent, streak }`

UI samo prikazuje rezultat; ne računa poslovna pravila.

### Achievements

`AchievementEvaluator` na osnovu progresa / završenog plana / streak-a odlučuje koje medalje otključati. Persistira `AchievementRepository`.

---

## 5. Tok podataka (primjeri)

### Čekiranje zadatka na Home

```
UI (checkbox)
  → ToggleTaskCompletion use case
    → CompletionRepository.save
    → ProgressCalculator + StreakCalculator
    → AchievementEvaluator (po potrebi)
  → UI re-render (novi progress / medalje)
```

### Kreiranje plana

```
Create Plan forma
  → CreatePlan use case (validacija)
    → PlanRepository + TaskRepository
  → navigacija na My Plans / postavi active
```

---

## 6. Persistencija (v1)

| Opcija | Namjena |
|--------|---------|
| **AsyncStorage** ili **expo-sqlite** | Lokalni store |

Preporuka: početi sa jednostavnim JSON store-om (AsyncStorage) iza repository interfejsa; kasnije zamijeniti SQLite bez diranja UI/domain-a.

---

## 7. Navigacija

- **React Navigation** bottom tabs (`src/presentation/navigation/RootTabs.tsx`)
- Tabovi: **Home · Plans · Create (+) · Stats · Profile** (FR-NAV-01, DESIGN.md)
- Centralni **+** je elevated FAB-style tab button → Create Plan
- **Achievements** je stack ekran (nije u tab baru); ulaz sa Home preview kasnije

---

## 8. Testiranje (cilj)

| Sloj | Pristup |
|------|---------|
| Domain policies | Unit testovi (prioritet) |
| Use cases | Unit sa mock repository |
| UI | Po potrebi kasnije |

---

## 9. Buduća proširenja (ne implementirati u v1)

- Remote API + auth → novi `data/remote` adapteri  
- Javni planovi → novi use case + My Plans search UI  
- Notifikacije → application scheduler + Expo Notifications
