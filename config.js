// ============================================================
//  KONFIGURATION – det eneste du normalt skal rette i.
//  Gem filen, upload til GitHub – færdig.
// ============================================================
window.APP_CONFIG = {
  // Overskrift på forsiden og navn på hjemmeskærmen
  title: "XPartners Konference",
  subtitle: "Torsdag 12. november 2026",

  // Logo øverst (erstat filen logo.png med en version i højere opløsning – samme filnavn)
  logo: "logo.png",

  // Google Forms: åbn formularen → "Send" → </> (indlejr) → kopiér src="..."-adressen hertil.
  // Så længe den står tom, vises en vejledning i stedet for formularen.
  formUrl: "",

  // Filer i mappen /pdf – overskriv med samme filnavn for at opdatere indholdet.
  pdfs: {
    dagsorden: "pdf/dagsorden.pdf",
    info: "pdf/info.pdf",
    menu: "pdf/menu.pdf"
  },

  // "Min plads": adressen på dit Google Apps Script (Udrul → Webapp → URL). Tom = fanen viser "offentliggøres på dagen".
  seatingUrl: "",
  seatingKey: "skift-mig-til-noget-tilfaeldigt",   // skal være den samme som APP_NOEGLE i Kode.gs
  seatingClosedText: "Bordplanen offentliggøres på dagen.",

  // Farver (hentet fra XPartners-præsentationen)
  colorRed:  "#EF3A3F",
  colorNavy: "#111947",
  colorBlue: "#5B8DD6",
  colorBg:   "#FBEDEC"
};
