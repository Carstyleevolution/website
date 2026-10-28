# Car Style Evolution - sito web

Nuova versione di carstyleevolution.it: un sito statico (solo HTML, CSS e immagini) da pubblicare gratis con GitHub Pages, senza database né abbonamenti.

Come è organizzato il sito e come si modifica: vedi [ARCHITETTURA.md](ARCHITETTURA.md).

## 1. Pubblicare con GitHub Actions e GitHub Pages

Il workflow `.github/workflows/pages.yml` rigenera il sito con Python e lo pubblica automaticamente dopo ogni push su `main`. GitHub Pages ospita il sito; GitHub Actions esegue la build e la pubblicazione.

1. Nel repository `Carstyleevolution/website`, apri **Settings → Pages** e scegli **Source: GitHub Actions**.
2. Carica i file dal terminale nella cartella del repository:
   ```powershell
   git add .
   git commit -m "Prepara sito e pubblicazione GitHub Pages"
   git push -u origin main
   ```
3. Apri la scheda **Actions** e attendi che **Pubblica sito su GitHub Pages** termini con successo. Il collegamento al sito compare nel deployment e in **Settings → Pages**.
4. Per ripubblicare senza nuovi commit, apri il workflow nella scheda Actions e scegli **Run workflow**.

Prima di collegare un dominio personalizzato, l'indirizzo previsto è `https://carstyleevolution.github.io/website/`. La pubblicazione usa solo HTML, immagini, CSS, JavaScript, font, robots.txt e sitemap.xml: la cartella sorgente e gli strumenti di build non vengono inclusi nei file del sito.

Il dominio su Aruba viene trasferito solo quando cambi le impostazioni del dominio descritte sotto.

## 2. Collegare il dominio carstyleevolution.it (quando il sito è approvato)

1. In **Settings → Pages → Custom domain** scrivi `carstyleevolution.it` e premi **Save**. GitHub aggiunge da solo un file `CNAME` al repository.
2. Nel pannello di Aruba, nella gestione DNS del dominio:
   - elimina i record **A** e **AAAA** del dominio principale (`@`) che puntano al vecchio sito Aruba;
   - aggiungi quattro record **A** per `@` con questi valori:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - imposta il record **CNAME** di `www` su `<tuo-utente>.github.io`;
   - non toccare eventuali record **MX** o **TXT**, che servono alla posta.
3. Aspetta che i DNS si aggiornino (da pochi minuti a 24 ore). Quando GitHub mostra il dominio come verificato, spunta **Enforce HTTPS**.
4. Consigliato: in **Settings del tuo account GitHub → Pages** aggiungi il dominio tra i "Verified domains". Così nessun altro può collegarlo a un suo sito.

Attenzione: se disdici il pacchetto del sito su Aruba, **non** disdire il dominio. Il dominio deve restare registrato e rinnovato.

Indirizzi vecchi: le pagine mantengono gli stessi indirizzi del sito Aruba (`/chi-siamo`, `/ppf`, `/contatti`…), quindi i link già presenti su Google continuano a funzionare. Le pagine che avevano un indirizzo diverso (`/-car-wrapping`, `/wrapping-interior-`, `/adesivi-vetrofanie`) rimandano in automatico a quelle nuove.

## 3. Modificare il sito

- **Telefono, email, orari, social, menu, titoli per Google:** `sorgente/dati/sito.json`
- **Testi delle pagine:** `sorgente/pagine/`
- **Progetti e foto:** `sorgente/dati/progetti.json` e le cartelle in `assets/img/progetti/`
- **Colori e font:** le prime righe di `assets/css/stile.css`

Dopo ogni modifica puoi rigenerare le pagine in locale e caricarle (Actions le rigenera comunque automaticamente al push):

```
python3 build.py
git add .
git commit -m "Descrizione della modifica"
git push
```

Serve solo Python 3, senza librerie da installare. Le pagine `.html` nella cartella principale vengono riscritte da `build.py`, quindi non vanno modificate a mano.

Per vedere il sito sul tuo computer prima di pubblicarlo: `python3 -m http.server`, poi apri http://localhost:8000 nel browser.

## 4. Da controllare prima di collegare il dominio

- **Email.** L’indirizzo corretto, confermato dal titolare, è `carstyleevolution@gmail.com`. Il sito lo usa nei recapiti, nei link email e nei moduli contatti. Per aggiornarlo, modificare solo `sorgente/dati/sito.json`.
- **Diritti sulle immagini.** Alcune foto sembrano prese da altri siti o generate con l'intelligenza artificiale: la vetrofania natalizia in home, la vetrofania "saldi" nella pagina servizi, la seconda foto dell'oscuramento vetri auto e le foto delle schede servizi in home (wrapping, oscuramento, PPF, custom, detailing). Se non sono vostre o non avete la licenza, conviene sostituirle con foto dei vostri lavori.
- **Privacy.** Il sito non usa cookie e non raccoglie dati: il modulo apre WhatsApp o l'app di posta del visitatore, e la mappa di Google si carica solo se il visitatore la chiede. Se volete comunque un'informativa privacy, va aggiunta come pagina (vedi ARCHITETTURA.md).
- **Recensioni.** Il riquadro recensioni del vecchio sito era un servizio di Aruba e non si può trasferire.
