# Roadmap — Protocol

## Vizija

Jednostavna, fokusirana mobilna app za lične planove i zadatke, sa jasnim dnevnim ritmom, streak-om i motivacijom kroz medalje — kasnije proširiva na dijeljenje planova.

---

## Faze proizvoda

| Faza | Naziv | Cilj | Status |
|------|--------|------|--------|
| **0** | Dokumentacija | Zahtjevi, arhitektura, taskovi | ✅ Gotovo |
| **1** | App shell | Navigacija + tema + placeholder ekrani | ✅ Gotovo |
| **2–4** | Jezgro | Domain, data, use cases | ✅ Gotovo |
| **5–6** | Unos podataka | Profile + Create Plan | ✅ Gotovo |
| **7–8** | Glavni tok | My Plans + Home (čekiranje, progres) | ✅ Gotovo |
| **9** | Motivacija | Achievements / medalje | ✅ Gotovo |
| **9b** | Statistike | Stats ekran | ✅ Gotovo |
| **10** | Stabilizacija | E2E, edge case-ovi, sync docs | ✅ Gotovo |
| **11+** | Rastezanje | Javni planovi, nalozi, sync, notifikacije | 📅 Kasnije |

Detaljni checkboxi: [TASKS.md](./TASKS.md).

---

## Prioriteti v1 (MVP)

1. Kreiranje plana sa pravilima ponavljanja  
2. Home sa dnevnim zadacima i čekiranjem  
3. Dnevni / sedmični / mjesečni progres + streak  
4. My Plans sa % završenosti i aktivnim planom  
5. Profile (ime + avatar)  
6. Achievements (osnovne medalje)

---

## Principi isporuke

- Male, završive cjeline (jedan TASK checkbox ≈ jedan PR / sesija).  
- Domain i testovi prije bogatog UI-a gdje ima smisla.  
- Dokumentacija se ažurira uz svaki završeni zadatak.

---

## Kasnije ideje (ne blokiraju v1)

- Pretraga javnih planova drugih korisnika  
- Cloud backup / multi-device  
- Podsetnici i kalendarski pregled  
- Statistike i grafikoni  
- Widgeti na početnom ekranu OS-a
