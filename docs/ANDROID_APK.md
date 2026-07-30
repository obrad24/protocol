# Android APK (EAS Build)

Instalabilni `.apk` bez Expo Go i bez Google Play naloga.

## Preduslovi

1. Nalog na [expo.dev](https://expo.dev/signup)
2. Node 22 (`nvm use` u rootu projekta)
3. EAS CLI:

```bash
npm install -g eas-cli
# ili: npx eas-cli@latest …
```

## Koraci

```bash
cd ~/Desktop/Protocol
nvm use
eas login
eas whoami          # potvrdi da si ulogovan
npm run build:apk   # = eas build -p android --profile preview
```

Pri **prvom** buildu EAS pita za Android keystore — izaberi da EAS generiše novi.

Kad build završi:

1. Otvori link iz terminala (ili [expo.dev/builds](https://expo.dev/builds))
2. Klikni **Download** za `.apk`
3. Prebaci na telefon i instaliraj (dozvoli instalaciju iz nepoznatih izvora / „Install unknown apps“)

## Profili (`eas.json`)

| Profil | Izlaz | Namjena |
|--------|--------|---------|
| `preview` | `.apk` | Interni test / direktna instalacija |
| `production` | `.aab` | Google Play Store |

## Napomene

- Package ID: `com.protocol.app` (u `app.json`)
- Build traje obično nekoliko minuta na EAS cloud-u (ili duže u redu na free planu)
- Free Expo plan ima mjesečni limit buildova
- Ako APK **padne odmah pri otvaranju**, treba novi build nakon native dependency izmjena (npr. `react-native-gesture-handler`). Stari APK se ne “popravlja” sam.
