# Smoke test ArtAround

Questa è la versione rapida del collaudo: **12 controlli**, da completare in circa un pomeriggio senza strumenti speciali. L'obiettivo è verificare che i flussi reali siano utilizzabili, non coprire ogni caso limite.

Usa [REGISTRO_COLLAUDO.csv](REGISTRO_COLLAUDO.csv): per ogni riga basta indicare `PASS` o `FAIL` e una nota breve. Le righe già eseguite da Codex hanno `Tester=Codex`; non serve ripeterle, salvo che tu voglia controllarle da telefono reale.

## Prima di iniziare

- Apri Navigator su smartphone e Editor su PC.
- Tieni a disposizione un account visitatore e un account admin/autore.
- Per le prove di modifica, crea dati con prefisso `QA-` per riconoscerli e cancellarli in seguito.

## I 12 controlli essenziali

| ID | Dove | Cosa fare | Esito atteso |
|---|---|---|---|
| NAV-01 | Navigator | Effettua login e apri l'elenco visite. | Vedi il museo e le visite disponibili, senza schermata bianca o messaggi tecnici. |
| NAV-02 | Navigator | Apri una visita e tocca **Inizia visita**. | Titolo, tappe e player sono coerenti; puoi avanzare e tornare indietro. |
| NAV-03 | Navigator | In una tappa-opera usa **Dimmi di più** / **Non capisco**. | Il racconto cambia oppure compare un messaggio comprensibile se non esiste una variante. |
| NAV-04 | Navigator | Apri la mappa dal player, cambia piano se disponibile e torna indietro. | Pin e pianta si caricano; torni alla stessa tappa. |
| NAV-05 | Navigator | Su telefono, scorri una tappa lunga e apri/chiudi **Comandi e info del museo**. | Testo, controlli e footer non si sovrappongono né escono dallo schermo. |
| NAV-06 | Navigator | Avvia, metti in pausa e ferma il racconto; cambia variante con un comando vocale e prova un item con TTS automatico. | TTS parte/pausa/stop senza sovrapposizioni e dopo il cambio legge la nuova variante, anche senza override TTS; il fallback voce non blocca l'uso touch. |
| EDT-01 | Editor | Login admin/autore, seleziona il museo e passa tra Musei, Contenuti e Visite. | Museo attivo e pagina selezionata sono sempre chiari. |
| EDT-02 | Editor | Cerca un'opera, apri i suoi item e controlla immagine, stato, durata e lingua. | La lista è leggibile e i dati item sono coerenti. |
| EDT-03 | Editor | Apri il builder di una visita pubblicata e confronta 2–3 tappe con Navigator. | Ordine, titoli, item iniziale e durata corrispondono. |
| EDT-04 | Editor | Crea un item QA con TTS automatico, poi attiva la personalizzazione e modifica prima il testo a schermo e poi quello audio. | Il testo automatico e la durata seguono quello a schermo; l'override resta modificabile, segnala un possibile disallineamento e persiste dopo il refresh. |
| EDT-05 | Editor | Crea o modifica una visita QA con una tappa-opera; pubblicala solo se i dati QA sono completi. | Il builder segnala chiaramente i campi/vincoli mancanti e salva la visita corretta. |
| UX-01 | Entrambi | In un flusso sopra, prova refresh, Indietro browser e una rete temporaneamente lenta/offline. | Nessuna pagina bianca o doppio salvataggio; messaggio comprensibile e recupero con refresh/riprova. |

## Regola pratica di decisione

Il deploy è pronto se non ci sono `FAIL` in NAV-01–05, EDT-01–03 e se le modifiche QA (EDT-04 o EDT-05) persistono correttamente. Per un fail, inserisci nel CSV una nota con: pagina, azione fatta e risultato osservato, più screenshot se utile.
