/**
 * XPartners Konference – Google Apps Script
 * Ligger i regnearket med tilmeldingerne (Udvidelser → Apps Script).
 *
 * Fanen "Bordplan" skal have disse kolonner i række 1 (rækkefølge er ligegyldig):
 *   Navn | Telefon | Bord | SMS sendt
 *
 * Funktioner:
 *   - doGet(navn)      : opslag fra appen – returnerer bord for et navn
 *   - sendBordSms()    : sender sms "du sidder ved bord X" til alle uden flueben i "SMS sendt"
 *   - sendFriSms()     : sender en fri besked til alle med telefonnummer
 */

const ARK_NAVN = 'Bordplan';

// ---- SMS-gateway (GatewayAPI.com – dansk, pay-as-you-go). Udfyld efter oprettelse. ----
const GATEWAYAPI_TOKEN = 'INDSÆT-DIN-API-TOKEN';
const AFSENDER = 'XPartners';          // max 11 tegn, vises som afsender

// ---- Sikkerhed: appen skal sende samme nøgle (sættes også i appens config.js) ----
const APP_NOEGLE = 'skift-mig-til-noget-tilfaeldigt';

// ============================================================
//  1. Bordopslag fra appen
// ============================================================
function doGet(e) {
  const p = e.parameter || {};
  const out = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  if (p.key !== APP_NOEGLE) return out({ fejl: 'Ingen adgang' });

  const navn = normaliser(p.navn || '');
  if (navn.length < 3) return out({ fejl: 'Skriv dit fulde navn' });

  const rows = hentRaekker();
  const hits = rows.filter(r => normaliser(r.Navn) === navn);
  if (hits.length === 0) {
    // prøv delvis match (fornavn + efternavn i vilkårlig rækkefølge)
    const dele = navn.split(' ').filter(Boolean);
    const loose = rows.filter(r => dele.every(d => normaliser(r.Navn).includes(d)));
    if (loose.length === 1) return out({ navn: loose[0].Navn, bord: String(loose[0].Bord || '') });
    return out({ fejl: 'Vi kunne ikke finde dit navn. Tjek stavningen eller spørg i receptionen.' });
  }
  return out({ navn: hits[0].Navn, bord: String(hits[0].Bord || '') });
}

// ============================================================
//  2. SMS
// ============================================================
function sendBordSms() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ARK_NAVN);
  const data = sheet.getDataRange().getValues();
  const head = data[0].map(String);
  const iNavn = head.indexOf('Navn'), iTlf = head.indexOf('Telefon'), iBord = head.indexOf('Bord'), iSendt = head.indexOf('SMS sendt');
  if ([iNavn, iTlf, iBord, iSendt].includes(-1)) throw new Error('Arket mangler en af kolonnerne: Navn, Telefon, Bord, SMS sendt');

  let antal = 0;
  for (let r = 1; r < data.length; r++) {
    const navn = data[r][iNavn], tlf = data[r][iTlf], bord = data[r][iBord], sendt = data[r][iSendt];
    if (!navn || !tlf || !bord || sendt === true || String(sendt).toLowerCase() === 'ja') continue;
    const fornavn = String(navn).trim().split(' ')[0];
    const besked = `Hej ${fornavn}, velkommen til XPartners Konference. Du sidder ved bord ${bord}. Vi ses!`;
    if (sendSms(tlf, besked)) { sheet.getRange(r + 1, iSendt + 1).setValue(true); antal++; }
  }
  SpreadsheetApp.getUi().alert(`Sendt ${antal} sms'er.`);
}

function sendFriSms() {
  const ui = SpreadsheetApp.getUi();
  const svar = ui.prompt('Besked til alle deltagere', 'Skriv beskeden (max 160 tegn for én sms):', ui.ButtonSet.OK_CANCEL);
  if (svar.getSelectedButton() !== ui.Button.OK || !svar.getResponseText().trim()) return;
  const besked = svar.getResponseText().trim();
  const rows = hentRaekker().filter(r => r.Telefon);
  const ok = ui.alert(`Send til ${rows.length} numre?`, `"${besked}"`, ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  let antal = 0;
  rows.forEach(r => { if (sendSms(r.Telefon, besked)) antal++; });
  ui.alert(`Sendt ${antal} sms'er.`);
}

function sendSms(telefon, besked) {
  const nr = String(telefon).replace(/[^\d]/g, '');
  const msisdn = nr.length === 8 ? '45' + nr : nr;   // dansk nummer uden landekode → +45
  const payload = { sender: AFSENDER, message: besked, recipients: [{ msisdn: msisdn }] };
  const res = UrlFetchApp.fetch('https://gatewayapi.com/rest/mtsms', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Token ' + GATEWAYAPI_TOKEN },
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('SMS-fejl til ' + msisdn + ': ' + res.getContentText()); return false; }
  return true;
}

// ============================================================
//  Menu i regnearket + hjælpere
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Konference')
    .addItem('Send bord-sms til alle nye', 'sendBordSms')
    .addItem('Send fri besked til alle', 'sendFriSms')
    .addToUi();
}

function hentRaekker() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ARK_NAVN);
  const data = sheet.getDataRange().getValues();
  const head = data[0].map(String);
  return data.slice(1).filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function normaliser(s) {
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim();
}
