# Zahtjevi — Protocol

Izvor: opis proizvoda (Home, Create Plan, My Plans, Achievements, Profile).  
Status: v1 — lokalna app bez naloga / cloud sinhronizacije (osim ako nije drugačije navedeno kao buduće).

---

## 1. Pregled proizvoda

Korisnik kreira **planove** sa zadacima i pravilima ponavljanja, prati **dnevni / sedmični / mjesečni progres** i **streak**, ostvaruje **medalje**, i upravlja **profilom**.

---

## 2. Funkcionalni zahtjevi

### 2.1 Navigacija i ekrani

| ID | Zahtjev |
|----|---------|
| FR-NAV-01 | Bottom bar ima: **Home**, **Plans**, centralni **+ (Create Plan)**, **Stats**, **Profile** (vidi DESIGN.md). |
| FR-NAV-02 | Korisnik može prelaziti između sekcija putem bottom navigacije. |
| FR-NAV-03 | **Achievements** je zaseban stack ekran (ulaz sa Home preview ili Profile), nije tab. |

### 2.2 Home

| ID | Zahtjev |
|----|---------|
| FR-HOME-01 | Header: **vremenski pozdrav + ime** (npr. „Dobro jutro, Janko“), datum / kratka motivaciona linija; avatar opciono desno. |
| FR-HOME-02 | *(zadržano u duhu)* Brand „Protocol“ nije obavezan u headeru; fokus je na pozdravu (DESIGN.md). |
| FR-HOME-03 | **Kartica dnevnog progresa** sa circular progress (%), brojem završenih / ukupnih zadataka. |
| FR-HOME-04 | Uz dnevni progres prikazuju se **streak**, **sedmični** i **mjesečni** progres (chipovi / metrike). |
| FR-HOME-05 | Prikazuje se kartica **aktivnog plana** (naziv, napredak npr. dan X/Y ili %). |
| FR-HOME-06 | Sekcija **Današnje obaveze**: lista dnevnih zadataka aktivnog plana (ikona, naziv, frekvencija). |
| FR-HOME-07 | Svaki dnevni zadatak može se **čekirati / odčekirati**. |
| FR-HOME-08 | Čekiranje odmah ažurira dnevni (i po potrebi sedmični/mjesečni) progres i streak. |
| FR-HOME-09 | Ako nema aktivnog plana, Home prikazuje prazno stanje sa CTA na kreiranje / izbor plana. |
| FR-HOME-10 | **Achievements preview** (horizontalni red medalja) sa ulazom na Achievements ekran. |
| FR-HOME-11 | Opciona kartica **sedmičnog progresa** (bar + mini chart) ispod liste ili uz nju. |

### 2.3 Create Plan

| ID | Zahtjev |
|----|---------|
| FR-PLAN-01 | Korisnik može kreirati plan sa **nazivom** i **opisom**. |
| FR-PLAN-02 | Korisnik bira tip trajanja plana: **sedmični**, **mjesečni** ili **višemjesečni**. |
| FR-PLAN-03 | Plan sadrži jedan ili više **zadataka**. |
| FR-PLAN-04 | Svaki zadatak ima pravilo ponavljanja: **svaki dan**. |
| FR-PLAN-05 | Svaki zadatak može imati pravilo: **X puta sedmično** (X je pozitivni cijeli broj). |
| FR-PLAN-06 | Svaki zadatak može imati pravilo: **određeni dani u sedmici** (npr. pon–sri–pet). |
| FR-PLAN-07 | Svaki zadatak može imati pravilo: **X puta mjesečno**. |
| FR-PLAN-08 | Validacija: naziv plana je obavezan; barem jedan zadatak sa validnim pravilom. |
| FR-PLAN-09 | Nakon uspješnog kreiranja, plan se čuva i dostupan je u My Plans; može se postaviti kao aktivan. |

### 2.4 My Plans

| ID | Zahtjev |
|----|---------|
| FR-PLANS-01 | Prikazuje se **lista svih planova** korisnika. |
| FR-PLANS-02 | Svaki plan je **kartica** sa: nazivom, opisom i **procentom završenosti**. |
| FR-PLANS-03 | Korisnik može izabrati plan kao **aktivan** (prikazuje se na Home). |
| FR-PLANS-04 | *(Buduće)* Omogućiti pretragu **javnih planova** drugih korisnika. |

### 2.5 Achievements

| ID | Zahtjev |
|----|---------|
| FR-ACH-01 | Ekran prikazuje kartice / sekcije: **Daily**, **Weekly**, **Monthly**, **Streak**. |
| FR-ACH-02 | Prikazuju se **osvojene** i **zaključane** medalje. |
| FR-ACH-03 | Postoje medalje tipa: **Perfect Day**, **Perfect Week**, **Perfect Month**. |
| FR-ACH-04 | Postoje **Streak** medalje (npr. za N uzastopnih dana). |
| FR-ACH-05 | **Svaki završeni plan** donosi odgovarajuću medalju (vezanu za tip / završetak plana). |
| FR-ACH-06 | Medalje se otključavaju automatski kada se ispune uslovi (bez ručnog claim-a u v1). |

### 2.6 Stats

| ID | Zahtjev |
|----|---------|
| FR-STATS-01 | Ekran **Statistike** prikazuje agregirani pregled performansi. |
| FR-STATS-02 | Segment kontrola najmanje: **Sedmica** / **Mjesec** (kasnije Dan / Godina). |
| FR-STATS-03 | Prikaz overall completion % i osnovnih KPI (završeni zadaci, streak, prosjek). |
| FR-STATS-04 | Vizuelizacije v1: jednostavan chart i/ili consistency grid (heatmap); bogatiji grafovi po DESIGN.md. |
| FR-STATS-05 | Lista bolje / najbolje performansi habit-a sa %. |

### 2.7 Profile

| ID | Zahtjev |
|----|---------|
| FR-PROF-01 | Korisnik može **promijeniti ime** (koristi se u pozdravu na Home). |
| FR-PROF-02 | Korisnik može postaviti / promijeniti **sliku profila**. |
| FR-PROF-03 | Profil čuva **ostale osnovne podatke** (minimalno: ime, avatar; proširivo npr. datum početka korišćenja). |

### 2.8 Progres, streak i završenost

| ID | Zahtjev |
|----|---------|
| FR-PROG-01 | **Dnevni progres** = udio dnevnih zadataka (za danas, prema pravilima ponavljanja) koji su čekirani. |
| FR-PROG-02 | **Sedmični progres** agregira ispunjenost zadataka u tekućoj sedmici. |
| FR-PROG-03 | **Mjesečni progres** agregira ispunjenost u tekućem mjesecu. |
| FR-PROG-04 | **Streak** = broj uzastopnih dana sa **100% dnevnim progresom**. |
| FR-PROG-05 | **Procenat završenosti plana** na kartici = ukupni napredak kroz trajanje plana (zadaci × ponavljanja u periodu). |
| FR-PROG-06 | **Perfect Day / Week / Month** se dodjeljuju kada je progres za taj period 100%. |

> **Odluka (v1):** streak raste samo ako je **dnevni progres = 100%** za taj dan. Dani bez due zadataka ne prekidaju i ne produžavaju streak.

---

## 3. Nefunkcionalni zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-01 | Aplikacija radi na **iOS i Android** preko Expo. |
| NFR-02 | **Nema web** verzije kao cilj proizvoda. |
| NFR-03 | Kod prati **clean architecture**, modularnost i laku proširivost. |
| NFR-04 | UI i logika su odvojeni; domen (plan, zadatak, progres, medalja) ne zavisi od React Native UI-a. |
| NFR-05 | Podaci se u v1 čuvaju **lokalno** na uređaju (persistencija). |
| NFR-06 | Dokumentacija (`docs/`) ostaje usklađena sa kodom. |
| NFR-07 | TypeScript strogo tipizira entitete i API-je domain/data sloja. |
| NFR-08 | UI prati **DESIGN.md** (mockup referenca: ljubičasti accent, kartice, circular progress, centralni +). |

---

## 4. Van opsega (v1)

- Autentifikacija, nalozi, cloud sync
- Javni planovi i socijalne funkcije (samo rezervisanje u UI/roadmap — FR-PLANS-04)
- Push notifikacije / podsetnici
- Plaćanja, pretplate
- Web klijent

---

## 5. Entiteti (konceptualno)

- **UserProfile** — ime, avatar URI, osnovni podaci  
- **Plan** — id, naziv, opis, tip trajanja, status (aktivan/neaktivan), period  
- **Task** — id, planId, naziv, pravilo ponavljanja  
- **RecurrenceRule** — daily | weeklyCount(X) | weekdays([...]) | monthlyCount(X)  
- **TaskCompletion** — taskId, date, completed  
- **Achievement / Medal** — tip, uslov, unlockedAt | locked  
- **ProgressSnapshot** — daily / weekly / monthly / streak (izračunato ili keširano)
