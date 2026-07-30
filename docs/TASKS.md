# Plan implementacije — Protocol

Pravila:
- Zadaci se rade **jedan po jedan**.
- Po završetku: označi `- [x]`, upiši unos u [CHANGELOG.md](./CHANGELOG.md).
- Ako se mijenja struktura: ažuriraj [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Faza 0 — Dokumentacija i baza projekta

- [x] 0.1 Kreirati `docs/` sa README, REQUIREMENTS, ARCHITECTURE, TASKS, ROADMAP, CHANGELOG
- [x] 0.2 Root README sa uputama za pokretanje
- [x] 0.3 Potvrditi Expo SDK 54 + TypeScript pokretanje na uređaju (Expo Go)

---

## Faza 1 — Infrastruktura aplikacije

- [x] 1.1 Dodati navigaciju (Expo Router ili React Navigation) sa 5 tabova: Home, Create Plan, My Plans, Achievements, Profile
- [x] 1.2 Postaviti `src/` folder strukturu po ARCHITECTURE.md (domain / application / data / presentation / shared)
- [x] 1.3 Dodati theme (boje, tipografija, razmaci) u `presentation/theme`
- [x] 1.4 Dodati placeholder ekrane za svih 5 tabova (naslov + prazan sadržaj)
- [x] 1.5 Povezati entry point (`App.tsx` / expo-router) sa navigacijom

---

## Faza 2 — Domain sloj

- [x] 2.1 Definirati `UserProfile` entitet
- [x] 2.2 Definirati `Plan` entitet + `PlanDuration` tip
- [x] 2.3 Definirati `Task` entitet
- [x] 2.4 Definirati `RecurrenceRule` value object (daily, weekly_count, weekdays, monthly_count)
- [x] 2.5 Definirati `TaskCompletion` entitet
- [x] 2.6 Definirati `Achievement` entitet (tipovi: Perfect Day/Week/Month, Streak, Plan Completed)
- [x] 2.7 Napisati repository interfejse (Plan, Completion, Profile, Achievement)
- [x] 2.8 Implementirati `ProgressCalculator` (daily / weekly / monthly / plan %)
- [x] 2.9 Implementirati `StreakCalculator` (v1: streak ako je dnevni progres 100%)
- [x] 2.10 Implementirati `AchievementEvaluator`
- [x] 2.11 Unit testovi za ProgressCalculator
- [x] 2.12 Unit testovi za StreakCalculator
- [x] 2.13 Unit testovi za AchievementEvaluator

---

## Faza 3 — Data sloj (lokalna persistencija)

- [x] 3.1 Odabrati i podesiti storage (AsyncStorage ili SQLite) iza abstrakcije
- [x] 3.2 Implementirati `ProfileRepository`
- [x] 3.3 Implementirati `PlanRepository` (+ taskovi vezani za plan)
- [x] 3.4 Implementirati `CompletionRepository`
- [x] 3.5 Implementirati `AchievementRepository`
- [x] 3.6 Seed / default profil (npr. ime „Janko“) za prvo pokretanje
- [x] 3.7 Composition root / DI: povezati repository implementacije sa use case-ovima

---

## Faza 4 — Application (use cases)

- [x] 4.1 `GetProfile` / `UpdateProfile`
- [x] 4.2 `CreatePlan` (validacija naziva, tipa, zadataka i recurrence)
- [x] 4.3 `ListPlans` (sa procentom završenosti)
- [x] 4.4 `SetActivePlan`
- [x] 4.5 `GetHomeDashboard` (pozdrav, progresi, streak, aktivni plan, dnevni zadaci)
- [x] 4.6 `ToggleTaskCompletion`
- [x] 4.7 `ListAchievements` (osvojene + zaključane)
- [x] 4.8 Nakon toggle/create/complete: pokrenuti evaluaciju medalja

---

## Faza 5 — Profile UI

- [x] 5.1 Profile ekran — prikaz imena i avatara
- [x] 5.2 Forma za izmjenu imena (FR-PROF-01)
- [x] 5.3 Odabir / promjena slike profila (FR-PROF-02)
- [x] 5.4 Prikaz osnovnih podataka (FR-PROF-03)
- [x] 5.5 Persistencija izmjena profila

---

## Faza 6 — Create Plan UI

- [x] 6.1 Forma: naziv i opis plana (FR-PLAN-01)
- [x] 6.2 Izbor trajanja: sedmični / mjesečni / višemjesečni (FR-PLAN-02)
- [x] 6.3 UI za dodavanje liste zadataka
- [x] 6.4 UI za pravilo: svaki dan (FR-PLAN-04)
- [x] 6.5 UI za pravilo: X puta sedmično (FR-PLAN-05)
- [x] 6.6 UI za pravilo: određeni dani u sedmici (FR-PLAN-06)
- [x] 6.7 UI za pravilo: X puta mjesečno (FR-PLAN-07)
- [x] 6.8 Validacija forme i poruke grešaka (FR-PLAN-08)
- [x] 6.9 Submit → CreatePlan use case; navigacija / feedback (FR-PLAN-09)

---

## Faza 7 — My Plans UI

- [x] 7.1 Lista planova kao kartice (FR-PLANS-01)
- [x] 7.2 Kartica: naziv, opis, procenat završenosti (FR-PLANS-02)
- [x] 7.3 Akcija „Postavi kao aktivan“ (FR-PLANS-03)
- [x] 7.4 Prazno stanje kad nema planova
- [x] 7.5 *(Placeholder)* Sekcija / disabled CTA za buduću pretragu javnih planova (FR-PLANS-04)

---

## Faza 8 — Home UI

- [x] 8.1 Header: pozdrav + ime, datum / motivacija, avatar (FR-HOME-01, DESIGN.md)
- [x] 8.2 Kartica dnevnog progresa — circular % + broj završenih (FR-HOME-03)
- [x] 8.3 Chipovi: streak, sedmični, mjesečni progres (FR-HOME-04)
- [x] 8.4 Kartica aktivnog plana (FR-HOME-05)
- [x] 8.5 Lista današnjih obaveza sa checkboxima (FR-HOME-06, FR-HOME-07)
- [x] 8.6 Povezati toggle sa use case-om i osvježiti progres (FR-HOME-08)
- [x] 8.7 Prazno stanje bez aktivnog plana (FR-HOME-09)
- [x] 8.8 Achievements preview + navigacija na Achievements (FR-HOME-10)
- [x] 8.9 Sedmični progress card / mini chart (FR-HOME-11)

---

## Faza 9 — Achievements UI

- [x] 9.1 Layout kartica / filteri (FR-ACH-01, DESIGN.md)
- [x] 9.2 Vizuelni prikaz osvojenih vs zaključanih medalja (FR-ACH-02)
- [x] 9.3 Perfect Day / Week / Month medalje (FR-ACH-03)
- [x] 9.4 Streak medalje (FR-ACH-04)
- [x] 9.5 Medalja za završen plan (FR-ACH-05)
- [x] 9.6 Automatsko otključavanje povezano sa evaluatorom (FR-ACH-06)
- [x] 9.7 Stack navigacija do Achievements (nije tab)

---

## Faza 9b — Stats UI

- [x] 9b.1 Segment Sedmica / Mjesec (FR-STATS-02)
- [x] 9b.2 Overall % i KPI kartice (FR-STATS-01, FR-STATS-03)
- [x] 9b.3 Osnovni chart / consistency grid (FR-STATS-04)
- [x] 9b.4 Lista najboljih habit-a (FR-STATS-05)

---

## Faza 10 — Integracija, polish, dokumentacija

- [x] 10.1 End-to-end prolaz: profil → create plan → active → home check → achievements
- [x] 10.2 Ispraviti edge case-ove (promjena dana, prazan plan, invalid recurrence)
- [x] 10.3 Ažurirati ARCHITECTURE.md status tabele da odgovara stvarnoj strukturi
- [x] 10.4 Pregled REQUIREMENTS vs implementacija (gap check)
- [x] 10.5 Označiti završene faze u ROADMAP.md

---

## Faza 11 — Buduće (van v1, ne počinjati dok v1 nije gotov)

- [ ] 11.1 Javni planovi — pretraga i pregled
- [ ] 11.2 Autentifikacija i sync
- [ ] 11.3 Push podsetnici
