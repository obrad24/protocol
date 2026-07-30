# Protocol

Mobilna aplikacija za praćenje zadataka kroz lične planove — dnevni progres, streak i medalje.

**Platforme:** iOS i Android (Expo Go)  
**Stack:** React Native · Expo SDK 54 · TypeScript  
**Arhitektura:** Clean Architecture (vidi dokumentaciju)

## Dokumentacija

Sva produktna i tehnička dokumentacija je u [`docs/`](./docs/):

- [DESIGN.md](./docs/DESIGN.md) — UI smjer (mockupi)
- [REQUIREMENTS.md](./docs/REQUIREMENTS.md) — zahtjevi
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — arhitektura
- [TASKS.md](./docs/TASKS.md) — plan implementacije
- [ROADMAP.md](./docs/ROADMAP.md) — roadmap
- [CHANGELOG.md](./docs/CHANGELOG.md) — changelog
- [ANDROID_APK.md](./docs/ANDROID_APK.md) — build i download Android APK
- [PLAY_STORE.md](./docs/PLAY_STORE.md) — checklist za Google Play Store

## Pokretanje

Zahtijeva **Node 22** (vidi `.nvmrc`). Sistemski Node 14 nije dovoljan.

```bash
cd ~/Desktop/Protocol
nvm use
npm install
npm start
```

1. Instaliraj [Expo Go](https://expo.dev/go) na telefonu.  
2. Telefon i računar na istoj Wi‑Fi mreži.  
3. Skeniraj QR kod iz terminala.

> Projekat koristi **Expo SDK 54** (kompatibilan sa Expo Go iz App Store / Play Store). SDK 57 trenutno nije pouzdano podržan u store verziji Expo Go.

## Android APK (bez Expo Go)

Za instalabilni `.apk` na telefon:

```bash
nvm use
eas login
npm run build:apk
```

Zatim download sa Expo build stranice. Detalji: [docs/ANDROID_APK.md](./docs/ANDROID_APK.md).

## Skripte

| Komanda | Opis |
|---------|------|
| `npm start` | Expo dev server |
| `npm run android` | Expo + Android |
| `npm run ios` | Expo + iOS (macOS) |
| `npm run build:apk` | EAS cloud build → Android APK |
| `npm test` | Domain unit testovi |
| `npm run typecheck` | TypeScript check |

## Razvoj

1. Uzmi sljedeći nezavršeni zadatak iz `docs/TASKS.md`.  
2. Implementiraj.  
3. Označi zadatak kao gotov i upiši izmjenu u `docs/CHANGELOG.md`.  
4. Ako se struktura promijeni — ažuriraj `docs/ARCHITECTURE.md`.
