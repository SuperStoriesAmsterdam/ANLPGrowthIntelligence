# Voortgang — CT Foundation Growth Intelligence

**Project:** ANLPGrowthIntelligence
**Doel:** Intern dashboard voor het CT Foundation groeitraject — verzamelt inzichten, quick wins, werkstromen en teamfeedback op een plek.
**Start:** 8 april 2026

---

## Wat het is

Een single-page dashboard (HTML + vanilla JS) met een Express/SQLite backend. Het team kan:

- Inzichten, quick wins en werkstromen bekijken en bewerken
- Per blok commentaar/annotaties achterlaten
- Bestanden uploaden
- Kaarten verwijderen die niet meer relevant zijn

Alles wordt opgeslagen in SQLite — geen externe database nodig. Draait als Docker container op Coolify.

---

## Wat er staat (9 april 2026)

### Infrastructuur
- [x] Express server met SQLite persistent storage
- [x] GET/PUT API voor dashboard state (edits, annotations, deleted)
- [x] Bestandsuploads via multer
- [x] Dockerfile klaar voor Coolify deploy
- [x] Overgestapt van PostgreSQL naar SQLite (eenvoudiger, geen docker-compose nodig)

### Dashboard features
- [x] Tabbed navigatie: Agenda, Quick Wins, Werkstromen, Data We Nodig Hebben, How This Works
- [x] Inline bewerkbaar — klik op tekst om aan te passen
- [x] Blok-level commentaarsysteem (teamnaam picker, geen auth)
- [x] Verwijder-functie per kaart/rij in edit mode
- [x] Quick wins met eigenaar + deadline per kaart
- [x] Funnel visualisatie + "What We've Tried" overzicht (samengevoegd in Quick Wins)
- [x] Bestandsuploads vanuit de browser

### Design/UX
- [x] DM Sans typografie, warm kleurenschema (--paper, --ink, --accent)
- [x] Alle tekst zwart (geen grijze copy meer)
- [x] Geen uppercase
- [x] Sans-serif geforceerd op alle elementen
- [x] Responsive nav overflow fix
- [x] Funnel layout fix
- [x] Message card typografie verbeterd

---

## Wat er nog moet gebeuren

- [ ] Deploy naar Coolify testen (Dockerfile staat klaar)
- [ ] Inhoud aanvullen met actuele CT Foundation data
- [ ] Team toegang geven en feedback verzamelen
- [ ] Eventueel: wachtwoordbeveiliging (nu open)
- [ ] Eventueel: export functie (PDF of CSV van quick wins/acties)

---

## Technische keuzes

| Onderdeel | Keuze | Waarom |
|-----------|-------|--------|
| Frontend | Single HTML + inline CSS/JS | Snel itereren, geen build stap |
| Backend | Express + better-sqlite3 | Minimaal, geen externe DB nodig |
| Opslag | SQLite in /data volume | Persistent via Docker volume |
| Uploads | multer naar /data/uploads | Simpel, geen cloud storage nodig |
| Deploy | Docker op Coolify | Zelfde patroon als TalktotheHand |

---

## Git geschiedenis (samenvatting)

**8 april:** Eerste versie dashboard, uitklapbare responses, annotatie tool
**9 april:** Grote bouwdag — inline editor, commentaarsysteem, teamnaam picker, funnel + quick wins tabs, data requests tab, PostgreSQL -> SQLite migratie, volledige UI rebuild (typografie, layout, navigatie)

---

*Laatst bijgewerkt: 9 april 2026*
