# Architettura del sito

Il sito è diviso in due parti:

- **sorgente**: dati, testi e layout, cioè quello che si modifica;
- **pagine pubblicate**: i file `.html` nella cartella principale, generati da `build.py` partendo dalla sorgente.

Per ristrutturare il sito si cambia la sorgente e si riesegue `python3 build.py`. Menu, piè di pagina, contatti e gallerie si aggiornano da soli su tutte le pagine.

## Mappa delle pagine

```
Home                                   index.html
├── Chi siamo                          chi-siamo.html
├── I nostri servizi                   i-nostri-servizi.html
│     sezioni: #car-wrapping  #interior-design  #oscuramento-edifici  #oscuramento-auto
│              #oscuramento-fari  #ppf  #vetrofanie  #car-detailing
├── Progetti                           progetti.html
│   ├── Car wrapping                   car-wrapping.html               11 progetti, 111 foto
│   ├── Wrapping interior design       wrapping-interior-design.html    6 progetti,  32 foto
│   ├── Oscuramento vetri              oscuramento-vetri.html           1 galleria,  10 foto
│   ├── PPF (Paint Protection Film)    ppf.html                         4 progetti,  43 foto
│   ├── Adesivi, vetrofanie e grafica  adesivi.html                     in aggiornamento
│   └── Car detailing                  car-detailing.html               in aggiornamento
├── Contatti                           contatti.html
└── (pagina di errore)                 404.html

Vecchi indirizzi che rimandano a quelli nuovi:
  -car-wrapping.html        → car-wrapping.html
  wrapping-interior-.html   → wrapping-interior-design.html
  adesivi-vetrofanie.html   → adesivi.html
```

Ogni pagina ha testata (logo, social, "Richiedi preventivo", menu) e piè di pagina (informazioni, contatti, orari, pagine, social). Home, Chi siamo e Contatti hanno anche il blocco "Contattaci" con il modulo.

## Cartelle e file

```
.
├── build.py                    genera le pagine (eseguire dopo ogni modifica)
├── README.md                   pubblicazione e dominio
├── ARCHITETTURA.md             questo file
│
├── sorgente/                   ── SI MODIFICA QUI ──
│   ├── dati/
│   │   ├── sito.json           dati dell'attività, menu, elenco pagine, reindirizzamenti
│   │   └── progetti.json       categorie dei progetti e testi delle gallerie
│   ├── layout/
│   │   ├── base.html           struttura comune: <head>, testata, menu, piè di pagina
│   │   └── blocco-contatti.html  il blocco "Contattaci" con il modulo
│   └── pagine/                 il contenuto centrale di ogni pagina
│       ├── home.html
│       ├── chi-siamo.html
│       ├── servizi.html
│       ├── progetti.html
│       ├── contatti.html
│       └── 404.html
│
├── assets/                     ── FILE USATI DIRETTAMENTE DAL SITO ──
│   ├── css/stile.css           tutto lo stile; colori e font nelle prime righe
│   ├── js/sito.js              menu su telefono, foto a tutto schermo, modulo, mappa
│   ├── font/                   Open Sans (ospitato qui, licenza in OFL.txt)
│   └── img/
│       ├── logo/               logo completo, scudo, favicon
│       ├── icone/              Facebook, Instagram, WhatsApp
│       ├── pagine/             foto dei testi: home/, chi-siamo/, servizi/
│       └── progetti/           una cartella per categoria, una sottocartella per progetto
│           └── car-wrapping/bmw-x5/
│               ├── 01.jpg … 15.jpg   foto grandi (lato lungo max 1600 px)
│               └── mini/             miniature per la griglia (640 px)
│
└── *.html, sitemap.xml, robots.txt, .nojekyll   ── GENERATI DA build.py, NON MODIFICARE ──
```

## Come nasce una pagina

`build.py` prende `sorgente/layout/base.html`, ci inserisce il contenuto della pagina (`sorgente/pagine/...` oppure la galleria generata da `progetti.json`) e sostituisce i segnaposto tra doppie graffe con i valori di `sito.json`.

Segnaposto utilizzabili nei testi delle pagine:

| Segnaposto | Diventa |
|---|---|
| `{{ name }}` | Car Style Evolution |
| `{{ phone_display }}` / `{{ phone_link }}` | il numero da mostrare / il numero per il link `tel:` |
| `{{ whatsapp_link }}` | il link https://wa.me/... |
| `{{ email }}` | l'indirizzo email |
| `{{ street }}`, `{{ town }}`, `{{ province }}` | l'indirizzo |
| `{{ vat_number }}` | la partita IVA |
| `{{ hours }}` | gli orari, un paragrafo per riga |
| `{{ maps_link }}` | il link a Google Maps |
| `{{ contact_block }}` | l'intero blocco "Contattaci" con il modulo |
| `{{ project_categories }}` | le schede delle categorie dei progetti (con foto e numero di foto) |

Se un testo usa un segnaposto che non esiste, la build si ferma e indica il file.

## Ristrutturare: le operazioni più comuni

**Cambiare telefono, email, orari o social.** Si modificano in `sito.json` → `business`, e il cambio vale per tutte le pagine.

**Riordinare o rinominare il menu.** In `sito.json` → `menu`: l'ordine della lista è l'ordine nel menu, `label` è il testo mostrato e `page` è il nome del file senza `.html`. Il menu del piè di pagina segue lo stesso elenco.

**Aggiungere una pagina.**
1. Crea `sorgente/pagine/nuova-pagina.html` con il contenuto (puoi copiare la struttura di `chi-siamo.html`).
2. Aggiungi una voce in `sito.json` → `pages` con `file`, `body`, `menu_page`, `title` e `description`.
3. Se deve comparire nel menu, aggiungila anche in `menu`.

**Togliere una pagina.** Togli la voce da `pages` (e da `menu`). Alla build successiva il vecchio `.html` viene cancellato. Se la pagina era già online, aggiungi un reindirizzamento (vedi sotto) così chi arriva da Google non trova un errore.

**Cambiare l'indirizzo di una pagina.** Cambia `file` (e il nome in `menu`), poi aggiungi in `redirects` una voce `{"from": "vecchio-nome", "to": "nuovo-nome"}`.

**Aggiungere un progetto alle gallerie.**
1. Crea la cartella `assets/img/progetti/<categoria>/<nome-progetto>/` e mettici le foto chiamate `01.jpg`, `02.jpg`… (in quest'ordine compaiono sul sito; lato lungo intorno a 1600 px).
2. Aggiungi il progetto in `progetti.json`, nella categoria giusta: `{"folder": "nome-progetto", "title": "...", "description": ["..."]}`.
3. Esegui `python3 build.py`. Su Mac le miniature in `mini/` vengono create in automatico. Su altri sistemi vanno create a mano (640 px), altrimenti la griglia usa le foto grandi.

**Aggiungere una categoria di progetti.** Aggiungi una voce in `progetti.json` → `categories`, con `slug` (diventa il nome della pagina), titoli, descrizione e immagine di copertina (`cover`, percorso dentro `assets/img/`). Le categorie senza progetti mostrano "Pagina in aggiornamento".

**Cambiare colori o font.** Si cambiano le variabili in cima a `assets/css/stile.css` (`--rosso`, `--colore-sfondo`, …).

## Regole da rispettare

- **Solo link relativi.** Si scrive `chi-siamo.html` e `assets/img/...`, mai con la barra iniziale (`/chi-siamo.html`). Così il sito funziona sia su `utente.github.io/repository/` sia sul dominio.
- **Le pagine `.html` della cartella principale non si modificano a mano.** `build.py` le cancella e le riscrive a ogni esecuzione. Riconosce i suoi file da un commento nella prima riga; i file senza quel commento non li tocca.
- **Nessun servizio esterno caricato in automatico.** Font e icone sono nel sito stesso, quindi non serve il banner dei cookie. Se in futuro si aggiungono statistiche, video di YouTube o simili, va valutato il banner.
- **Foto pulite.** Prima di pubblicare foto scattate col telefono conviene togliere i dati di posizione GPS. Le foto importate dal vecchio sito sono già state ripulite.

## Differenze rispetto al vecchio sito

- Il layout si adatta al telefono: il vecchio sito aveva una larghezza fissa di 1024 px.
- Il modulo contatti apre WhatsApp o l'email. Il vecchio modulo passava dai server di Aruba e su GitHub Pages non può funzionare.
- La mappa si carica solo su richiesta del visitatore.
- Ogni pagina ha un titolo e una descrizione propri per Google: prima erano tutti uguali.
- I pulsanti "Progetti" della pagina servizi portano alla galleria del servizio corrispondente.
- Corretti alcuni refusi (per esempio "Esperenzia", "ALLESTIEMNTO", "II nostro", "Sabato 9,30-13-00") e uniformati gli orari.
- Il link WhatsApp della testata, che nel vecchio sito era rotto, ora funziona.
