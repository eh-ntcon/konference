# Konference-app – vejledning

Gratis opsætning: statisk side på GitHub Pages + Google Forms til tilmeldinger.

## Filerne

| Fil | Hvad den gør | Skal du røre den? |
|---|---|---|
| `config.js` | Titel, dato, formular-link, farver | **Ja – det er her du retter** |
| `pdf/dagsorden.pdf`, `pdf/info.pdf`, `pdf/menu.pdf` | Indholdet på de tre faner | **Ja – overskriv med dine egne (samme filnavn)** |
| `logo.png` | Logo øverst i appen | **Ja – erstat med højopløst version, samme filnavn** |
| `icons/icon-192.png`, `icons/icon-512.png` | App-ikon på hjemmeskærmen (det røde mærke) | Kun hvis I vil have et andet ikon |
| `google-apps-script/Kode.gs` | Bordopslag + sms fra Google Sheet | Indsættes én gang i regnearket (se pkt. 6) |
| `navneskilte/lav_navneskilte.py` | Laver navneskilte med QR-kode | Køres når deltagerlisten er klar (se pkt. 7) |
| `index.html`, `sw.js`, `manifest.json`, `lib/` | Selve appen og PDF-viseren | Nej |

## 1. Google Forms (tilmeldinger)

1. Gå til forms.google.com → *Tom formular*.
2. Tilføj spørgsmål: Navn, E-mail, Firma, Deltager (ja/nej), Kostbehov, evt. Bemærkninger.
3. Fanen **Svar** → klik det grønne Sheets-ikon → *Opret nyt regneark*. Alle svar lander nu automatisk i arket.
   Excel: i arket vælg *Filer → Download → Microsoft Excel (.xlsx)*.
4. **Send** (øverst til højre) → fanen `< >` → kopiér adressen i `src="..."`.
5. Indsæt den i `config.js` som `formUrl`.

Kun du (og dem du deler regnearket med) kan se svarene. Deltagerne ser kun formularen.

Tip: Under *Indstillinger* → *Svar* kan du slå "Begræns til 1 svar" fra, hvis folk ikke skal logge ind med Google-konto.

## 2. GitHub Pages (hosting)

1. Opret gratis konto på github.com.
2. *New repository* → navn fx `konference` → Public → Create.
3. *Add file → Upload files* → træk **alle** filer og mapper fra denne pakke ind → *Commit*.
4. *Settings → Pages* → Source: *Deploy from a branch* → Branch: `main`, mappe `/ (root)` → Save.
5. Efter 1-2 min. er siden live på `https://<dit-brugernavn>.github.io/konference/`.

Del linket med deltagerne (QR-kode er praktisk – fx via qr-code-generator.com).

## 3. PDF'erne – sådan ser de bedst ud

Siderne vises som almindelige app-sider (ingen PDF-ramme), så de skal laves til mobil:

- **Sidestørrelse:** stående, smal – fx *brugerdefineret 105 × 175 mm* i PowerPoint (Design → Slidestørrelse) eller A5 stående i Word. Så fylder én side præcis skærmen.
- **Design:** hvid baggrund, rød overskrift (`#EF3A3F`), mørkeblå bokse (`#111947`), Open Sans/Segoe UI – samme som præsentationen.
- **Flere sider** vises efter hinanden som én lang side.
- Gem som PDF → læg i `pdf/` med det rigtige filnavn.

## 4. Opdatere indhold senere

- **Ny dagsorden/menu/info:** upload den nye PDF til mappen `pdf/` med samme filnavn (GitHub spørger om du vil erstatte – ja).
- **Ny tekst/dato/farve:** rediger `config.js` direkte på GitHub (blyant-ikonet) → Commit.
- Ændringer er synlige inden for ca. 1 minut. Har telefonen cachet den gamle version, så åbn appen igen eller ret `VERSION` i `sw.js` til fx `v2`.

## 5. "Læg på hjemmeskærm"

- **iPhone (Safari):** Del-ikon → *Føj til hjemmeskærm*.
- **Android (Chrome):** Appen viser selv en "Installér"-knap; ellers menu ⋮ → *Føj til startskærm*.

## 6. Bordplan, "Min plads" og sms (Google Sheet)

Alt styres fra regnearket med tilmeldingerne.

**A. Fanen "Bordplan"**
1. Opret en ny fane i regnearket og kald den `Bordplan`.
2. Række 1: `Navn`, `Telefon`, `Bord`, `SMS sendt` (nøjagtigt stavet).
3. Kopiér navn og telefon fra formularsvarene (eller brug en formel som `=Formularsvar!B2`), og skriv bordnummer i `Bord`.

**B. Scriptet**
1. I regnearket: *Udvidelser → Apps Script*. Slet det der står, indsæt hele `google-apps-script/Kode.gs`.
2. Øverst i scriptet: ret `APP_NOEGLE` til et tilfældigt ord (fx `xp2026-blaa-elefant`) – samme ord skrives i `config.js` som `seatingKey`.
3. *Udrul → Ny udrulning → Type: Webapp* → Kør som: *Mig* → Hvem har adgang: *Alle* → Udrul. Godkend adgang. Kopiér webapp-adressen ind i `config.js` som `seatingUrl`.
4. Genindlæs regnearket – der er nu en menu **Konference** øverst.

Fanen "Min plads" i appen slår nu op i arket. Ingen andre kan se listen – man får kun sit eget bord.

**C. SMS**
1. Opret konto på gatewayapi.com (dansk, ingen abonnement – ca. 0,30–0,40 kr/sms). Sæt fx 100 kr. ind.
2. *API → Opret API-token* → indsæt som `GATEWAYAPI_TOKEN` i scriptet. Gem, og udrul igen (*Udrul → Administrér udrulninger → blyant → Ny version*).
3. I regnearket: **Konference → Send bord-sms til alle nye**. Alle uden flueben i `SMS sendt` får: *"Hej Mette, velkommen til XPartners Konference. Du sidder ved bord 4. Vi ses!"* – og får sat flueben. Flytter du nogen, så fjern fluebenet og kør igen.
4. **Konference → Send fri besked til alle** – til fx "Vi starter om 10 min i salen".

Teksten i bord-sms'en rettes i scriptet (linjen med `const besked`).

## 7. Navneskilte med QR-kode

Scanner man QR-koden med telefonens kamera, kan man gemme personen som kontakt (navn, firma, titel, mail, telefon).

1. Download deltagerlisten som Excel med kolonnerne `Navn`, `Firma`, `Titel`, `Email`, `Telefon`, `Bord` (kun Navn er påkrævet). Se `navneskilte/eksempel-deltagere.csv`.
2. Kør: `python3 navneskilte/lav_navneskilte.py deltagere.xlsx` → `navneskilte.pdf` (A4, 8 skilte pr. side, 90 × 60 mm – passer i standard badge-holdere).
   Har du ikke Python: send mig listen, så laver jeg PDF'en.
3. Print, skær ud langs de grå linjer.

`navneskilte/eksempel-navneskilte.pdf` viser hvordan de ser ud.

## Omkostninger

GitHub Pages: 0 kr. Google Forms/Sheets/Apps Script: 0 kr. SMS: ca. 0,30–0,40 kr. pr. stk. (100 deltagere × 2 sms ≈ 70 kr.). Eget domæne (valgfrit): ca. 100 kr/år.
