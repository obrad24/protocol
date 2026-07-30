# Protocol — Dokumentacija

**Protocol** je mobilna aplikacija za praćenje ličnih zadataka kroz planove (sedmične, mjesečne i višemjesečne), sa dnevnim progresom, streak-om i sistemom medalja.

## Stack

| Sloj | Tehnologija |
|------|-------------|
| Mobilni klijent | React Native (Expo SDK 54) + TypeScript |
| Platforme | iOS i Android (bez web verzije) |
| Arhitektura | Clean Architecture (presentation / domain / data) |

## Dokumenti

| Fajl | Sadržaj |
|------|---------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Funkcionalni i nefunkcionalni zahtjevi |
| [DESIGN.md](./DESIGN.md) | UI smjer iz mockupa (paleta, layout, nav) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Struktura projekta, moduli, tok podataka |
| [TASKS.md](./TASKS.md) | Plan implementacije (checkbox zadaci) |
| [ROADMAP.md](./ROADMAP.md) | Faze razvoja i prioriteti |
| [CHANGELOG.md](./CHANGELOG.md) | Istorija izmjena |
| [ANDROID_APK.md](./ANDROID_APK.md) | EAS Build → download Android APK |
| [PLAY_STORE.md](./PLAY_STORE.md) | Checklist za Google Play Store |

## Pokretanje

```bash
cd ~/Desktop/Protocol
nvm use          # Node 22 (.nvmrc)
npm start        # Expo Go na telefonu (ista Wi‑Fi mreža)
```

Detalji o pokretanju i konvencijama: vidi root [README.md](../README.md).

## Pravila održavanja dokumentacije

1. Nakon završetka svakog zadatka u `TASKS.md` — označi `- [x]` i upiši unos u `CHANGELOG.md`.
2. Ako se promijeni struktura foldera, moduli ili tok podataka — ažuriraj `ARCHITECTURE.md`.
3. Novi funkcionalni zahtjevi idu prvo u `REQUIREMENTS.md`, zatim u `TASKS.md` / `ROADMAP.md`.
4. Dokumentacija mora biti usklađena sa kodom; ne preskači je.
