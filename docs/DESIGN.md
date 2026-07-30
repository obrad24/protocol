# Design system — Protocol

Vizuelni smjer preuzet iz mockupa (referenca).  
Slike: [ui-primer-1.png](./references/ui-primer-1.png), [ui-primer-2.png](./references/ui-primer-2.png).

Implementacija treba da **otprilike prati** ove ekrane (layout, hijerarhija, komponente), ne pixel-perfect kopiju.

---

## 1. Navigacija (bottom bar)

Pet stavki, centralni FAB:

| Pozicija | Ekran | Napomena |
|----------|--------|----------|
| 1 | **Home** | Dashboard |
| 2 | **Plans** | Moji planovi (+ kasnije Explore) |
| 3 | **+** (Create) | Istaknuto dugme — kreiranje plana |
| 4 | **Stats** | Statistike / analitika |
| 5 | **Profile** | Profil |

**Achievements** nije tab — otvara se kao stack ekran (npr. sa Home preview sekcije ili iz Profile).

---

## 2. Paleta

| Token | Vrijednost | Upotreba |
|-------|------------|----------|
| `primary` | `#6C5CE7` / `#7B61FF` | CTA, aktivni tab, checkbox, progress stroke |
| `primaryMuted` | `#EDE9FE` | chipovi, soft pozadine |
| `background` | `#F5F6FA` | screen bg |
| `surface` | `#FFFFFF` | kartice |
| `text` | `#1A1A2E` | naslovi |
| `textMuted` | `#8B8FA3` | sekundarni tekst |
| `success` | `#22C55E` | završeno, pozitivni trend |
| `warning` / streak | `#F59E0B` / `#FB923C` | streak / vatreni accent |
| `border` | `#E8EAF0` | separatorii |
| `locked` | sivi / desaturirani | zaključane medalje |

Kartice: bijela površina, blaga sjena ili tanki border, **veliki radius** (~16–20).

---

## 3. Tipografija i ritam

- Sans-serif (sistemski / Expo default za v1; kasnije custom font po želji)
- Veliki bold naslovi (greeting, section titles)
- Caption sivi za frekvenciju zadatka („Svaki dan“, „4x sedmično“)
- Padding ekrana ~16–20; razmak između kartica ~12–16

---

## 4. Home (Dashboard) — struktura

1. **Header:** vremenski pozdrav + ime („Dobro jutro, Janko“), datum / kratka motivaciona linija; avatar desno (opciono zvono)
2. **Daily progress card:** veliki **circular progress** (%); pored summary (npr. 8/11) + mini sedmični barovi; streak / week / month metrike u istom ili susjednom bloku
3. **Današnje obaveze:** lista habit redova — ikona kategorije, naziv, frekvencija, **circular checkbox** (ljubičasti check)
4. **Weekly progress card:** horizontalni bar + mini chart
5. **Active plan card:** thumbnail/placeholder, naziv, dan X/Y, progress bar
6. **Achievements preview:** horizontalni scroll medalja → tap otvara Achievements

---

## 5. Ostali ekrani (smjer)

### Stats
- Segment: Week / Month (kasnije Day / Year po primeru 2)
- Veliki completion % + trend
- Line chart / heatmap konzistentnosti
- „Najbolje navike“ lista sa % barovima

### Achievements
- Filter chipovi (All / Streaks / Special ili Daily–Weekly–Monthly–Streak)
- Grid kartica: ikona, naslov, opis; unlocked vs locked (padlock / grayscale)
- Featured / najnovija medalja na vrhu (opciono)

### My Plans
- Kartice planova sa circular ili linear % 
- Sekcije Active / Paused / Finished (v1: barem lista + aktivan badge)
- Placeholder za **Explore** javne planove

### Create Plan
- Forma: naziv, opis, trajanje, (kasnije kategorija / težina)
- Lista zadataka + recurrence picker
- Primary CTA „Sačuvaj“

### Profile
- Avatar, ime, edit
- Osnovni podaci

---

## 6. Dijeljene UI komponente (za implementaciju)

| Komponenta | Namjena |
|------------|---------|
| `CircularProgress` | Home / plan kartice |
| `ProgressBar` | weekly / plan / habit |
| `HabitRow` | checkbox red na Home |
| `PlanCard` | My Plans |
| `MedalCard` | Achievements |
| `StatChip` | streak, week %, month % |
| `ScreenHeader` | title + optional actions |
| `PrimaryButton` / `FAB` | CTA i centralni + |

---

## 7. Jezik UI-a

Primarni jezik stringova: **bosanski / hrvatski / srpski (ijekavica)** kako u primeru 2 („Dobro jutro“, „Današnje obaveze“, „Moji planovi“).  
Engleski mockup (primer 1) služi samo kao vizuelna referenca.
