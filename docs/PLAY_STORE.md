# Google Play Store — checklist

Taskovi za objavu **Protocol** na Google Play.  
Radi jedan po jedan; označi `- [x]` kad završiš.

Povezano: [ANDROID_APK.md](./ANDROID_APK.md) (lokalni APK / EAS preview).

---

## Faza A — Preduslovi

- [ ] A.1 Napraviti / imati Google nalog
- [ ] A.2 Registrovati se na [Google Play Console](https://play.google.com/console) (jednokratno **$25**)
- [ ] A.3 Proći developer identity / verifikaciju (lični ili organization account)
- [ ] A.4 Potvrditi da je Expo nalog povezan (`eas whoami`) i da projekat ima `android.package` (`com.protocol.app`)

---

## Faza B — App spremna za store

- [ ] B.1 App stabilna na uređaju (kritični tokovi: create plan, home check, profile, stats)
- [ ] B.2 Privacy policy — javni URL (stranica koju Google može otvoriti)
- [ ] B.3 U privacy policy opisati: lokalno čuvanje podataka, avatar/galerija dozvola, nema (ili ima) cloud sync / analitike
- [ ] B.4 Provjeriti dozvole u `app.json` / pluginima (npr. `expo-image-picker`) — samo ono što app stvarno koristi
- [ ] B.5 Ikona i adaptive icon finalni (store + launcher)
- [ ] B.6 Bump verzije za release (`version` u `app.json`; `versionCode` / EAS remote versioning)

---

## Faza C — Store listing materijali

- [ ] C.1 Naziv app-a (do 30 karaktera) — npr. Protocol
- [ ] C.2 Kratki opis (do 80 karaktera)
- [ ] C.3 Dugi opis (feature-i, jezik BH/HR)
- [ ] C.4 Ikona **512×512** PNG
- [ ] C.5 Feature graphic **1024×500** PNG
- [ ] C.6 Najmanje **2** phone screenshot-a (preporuka 4–6: Home, Create Plan, Plans, Stats)
- [ ] C.7 Kontakt email za store listing
- [ ] C.8 Kategorija (npr. Productivity)
- [ ] C.9 (Opciono) promo video, tablet screenshot-i

---

## Faza D — Production build (AAB)

- [ ] D.1 Potvrditi `eas.json` profil `production` → `android.buildType: app-bundle`
- [ ] D.2 Pokrenuti production build:
  ```bash
  eas build -p android --profile production
  ```
- [ ] D.3 Sačekati uspješan build na [expo.dev/builds](https://expo.dev/builds)
- [ ] D.4 Preuzeti / zabilježiti AAB (ili koristiti direktan submit sa EAS)
- [ ] D.5 Pri prvom release-u: Play App Signing — prihvatiti Google signing (preporučeno)

---

## Faza E — Play Console setup

- [ ] E.1 Create app u Play Console (ime, default language, free/paid, declarations)
- [ ] E.2 Popuniti **Store listing** (tekstovi + grafike iz Faze C)
- [ ] E.3 **App content** → Privacy policy URL
- [ ] E.4 **Data safety** forma (šta se prikuplja; za v1: lokalni podaci, bez prodaje podataka)
- [ ] E.5 **Content rating** upitnik (IARC)
- [ ] E.6 Target audience / news apps / COVID / itd. forme — odgovoriti tačno (obično “No”)
- [ ] E.7 Ads declaration (da li app ima reklame — v1: No)
- [ ] E.8 Select countries / pricing (free)

---

## Faza F — Test track pa production

- [ ] F.1 Upload AAB na **Internal testing**
- [ ] F.2 Dodati sebe (i eventualno testere) na email listu
- [ ] F.3 Instalirati preko internal test linka i proći smoke test
- [ ] F.4 Ispraviti bugove; po potrebi novi AAB (uvećan versionCode)
- [ ] F.5 (Preporuka) **Closed testing** sa malom grupom
- [ ] F.6 Poslati na **Production** review
- [ ] F.7 Sačekati Google review (prvi put: često 1–7 dana)
- [ ] F.8 Kad je **Published** — provjeriti listing na Play Store-u

---

## Faza G — Nakon objave (održavanje)

- [ ] G.1 Svaki store update = novi AAB + veći versionCode
- [ ] G.2 (Opciono) Uvesti **EAS Update** za JS-only hotfixeve bez novog AAB-a
- [ ] G.3 Pratiti Play Console → crashes / ANR / reviews
- [ ] G.4 Čuvati keystore / EAS credentials backup (ne commitovati u git)

---

## Brzi referencni komande

```bash
cd ~/Desktop/Protocol
nvm use
eas whoami

# Interni APK (test van store-a)
npm run build:apk

# Store AAB
eas build -p android --profile production

# (Opciono) Submit na Play kad je Console povezan
eas submit -p android --latest
```

---

## Napomene

- **APK** (`preview`) = direktna instalacija; **AAB** (`production`) = Play Store.
- Ne mijenjaj `com.protocol.app` nakon prve objave.
- Bez privacy policy URL-a Google često blokira objavu.
- Dok nema cloud naloga / analitike, Data safety treba jasno reći da su podaci na uređaju.
