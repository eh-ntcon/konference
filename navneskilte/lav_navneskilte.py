#!/usr/bin/env python3
"""
Navneskilte med QR-kode (vCard) i XPartners-design.

Brug:
    python3 lav_navneskilte.py deltagere.xlsx        (eller .csv)
    → navneskilte.pdf  (A4-ark, 2 × 4 skilte pr. side, 90 × 60 mm – passer til standard badge-holdere)

Kolonner (rækkefølge ligegyldig, kun Navn er påkrævet):
    Navn | Firma | Titel | Email | Telefon | Bord

Scanner man QR-koden med telefonens kamera, tilbydes "Tilføj kontakt" med navn, firma, titel, mail og telefon.
"""
import sys, csv, io, os
import qrcode
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

RED, NAVY, GREY, PINK = HexColor("#EF3A3F"), HexColor("#111947"), HexColor("#6b6b6b"), HexColor("#FBEDEC")
HER = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HER, "..", "logo.png")

W, H = 90 * mm, 60 * mm           # skiltets størrelse
COLS, ROWS = 2, 4
PW, PH = A4
MX = (PW - COLS * W) / 2
MY = (PH - ROWS * H) / 2


def laes(sti):
    if sti.lower().endswith((".xlsx", ".xlsm")):
        import openpyxl
        ws = openpyxl.load_workbook(sti, read_only=True).active
        rows = [[("" if c is None else str(c)).strip() for c in r] for r in ws.iter_rows(values_only=True)]
    else:
        with open(sti, encoding="utf-8-sig") as f:
            sample = f.read(2048); f.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=";,")
            rows = [[c.strip() for c in r] for r in csv.reader(f, dialect)]
    head = [h.strip().lower() for h in rows[0]]
    out = []
    for r in rows[1:]:
        if not any(r):
            continue
        d = {head[i]: (r[i] if i < len(r) else "") for i in range(len(head))}
        if d.get("navn"):
            out.append(d)
    return out


def vcard(p):
    navn = p.get("navn", "")
    dele = navn.split(" ")
    efter, forn = (dele[-1], " ".join(dele[:-1])) if len(dele) > 1 else ("", navn)
    linjer = ["BEGIN:VCARD", "VERSION:3.0", f"N:{efter};{forn};;;", f"FN:{navn}"]
    if p.get("firma"):   linjer.append(f"ORG:{p['firma']}")
    if p.get("titel"):   linjer.append(f"TITLE:{p['titel']}")
    if p.get("email"):   linjer.append(f"EMAIL;TYPE=WORK:{p['email']}")
    if p.get("telefon"): linjer.append(f"TEL;TYPE=CELL:{p['telefon']}")
    linjer.append("END:VCARD")
    return "\n".join(linjer)


def qr_png(tekst):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=1)
    q.add_data(tekst); q.make(fit=True)
    img = q.make_image(fill_color="#111947", back_color="white")
    buf = io.BytesIO(); img.save(buf, format="PNG"); buf.seek(0)
    return ImageReader(buf)


def tegn_skilt(c, x, y, p):
    # baggrund + skærelinje
    c.setFillColor(HexColor("#ffffff")); c.setStrokeColor(HexColor("#dddddd")); c.setLineWidth(0.3)
    c.rect(x, y, W, H, fill=1, stroke=1)
    # rosa felt i toppen med logo
    c.setFillColor(PINK); c.rect(x, y + H - 12 * mm, W, 12 * mm, fill=1, stroke=0)
    if os.path.exists(LOGO):
        c.drawImage(LOGO, x + 5 * mm, y + H - 9 * mm, width=32 * mm, height=4.1 * mm, mask="auto")
    # bord (øverst til højre)
    if p.get("bord"):
        c.setFillColor(NAVY); c.roundRect(x + W - 24 * mm, y + H - 9.5 * mm, 19 * mm, 7 * mm, 3.5 * mm, fill=1, stroke=0)
        c.setFillColor(HexColor("#ffffff")); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(x + W - 14.5 * mm, y + H - 7.4 * mm, f"Bord {p['bord']}")
    # QR til højre
    qs = 26 * mm
    c.drawImage(qr_png(vcard(p)), x + W - qs - 5 * mm, y + 5 * mm, width=qs, height=qs)
    c.setFillColor(GREY); c.setFont("Helvetica", 5.5)
    c.drawCentredString(x + W - qs / 2 - 5 * mm, y + 2.5 * mm, "Scan for kontaktoplysninger")
    # navn, firma, titel til venstre
    tw = W - qs - 15 * mm
    navn = p.get("navn", "")
    size = 16
    while c.stringWidth(navn, "Helvetica-Bold", size) > tw and size > 9:
        size -= 1
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", size)
    c.drawString(x + 5 * mm, y + 27 * mm, navn)
    c.setFillColor(RED); c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 5 * mm, y + 21 * mm, p.get("firma", "")[:40])
    c.setFillColor(GREY); c.setFont("Helvetica", 8.5)
    c.drawString(x + 5 * mm, y + 16 * mm, p.get("titel", "")[:45])


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    folk = laes(sys.argv[1])
    ud = sys.argv[2] if len(sys.argv) > 2 else "navneskilte.pdf"
    c = canvas.Canvas(ud, pagesize=A4)
    for i, p in enumerate(folk):
        k = i % (COLS * ROWS)
        if i and k == 0:
            c.showPage()
        col, row = k % COLS, k // COLS
        tegn_skilt(c, MX + col * W, PH - MY - (row + 1) * H, p)
    c.save()
    print(f"{len(folk)} navneskilte → {ud}")


if __name__ == "__main__":
    main()
