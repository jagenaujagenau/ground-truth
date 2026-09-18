/** Copy that belongs to the site. The panel's own strings come from the extension's catalogs. */
export type SiteCopy = {
  metaTitle: string
  metaDescription: string
  navDemo: string
  navGet: string
  tagline: string
  heroTitle: string
  heroLede: string
  heroAdd: string
  heroDemo: string
  simPlaceholder: string
  simRead: string
  simTryOne: string
  simBlankTitle: string
  simBlankBody: string
  simCaption: string
  simUrlLabel: string
  simNewTab: string
  simPanelAria: string
  simToggleAria: string
  simNothingTitle: string
  simOpenOriginal: string
  simTranscript: string
  idleTitle: string
  idleBody: string
  featuresTitle: string
  featuresLede: string
  feature1Title: string
  feature1Body: string
  feature2Title: string
  feature2Body: string
  feature3Title: string
  feature3Body: string
  feature4Title: string
  feature4Body: string
  bandTitle: string
  bandLede: string
  bandCta: string
  footerLine: string
  footerPrivacy: string
  languageLabel: string
  errAddress: string
  errBlocked: string
  errUnreachable: string
  errNotPage: string
  errThin: string
  errCaptions: string
  errRate: string
  errDaily: string
  errService: string
  errUnknown: string
}

const en: SiteCopy = {
  metaTitle: 'Ground Truth — see how the story you’re reading is framed',
  metaDescription:
    'A browser extension that reads the article in your current tab and shows how it leans: left, center or right, how loaded the language is, and whether it’s news or opinion.',
  navDemo: 'Demo',
  navGet: 'Get it',
  tagline: 'A bias check for whatever you’re reading',
  heroTitle: 'See how the story you’re reading is framed.',
  heroLede:
    'Ground Truth sits beside the article and shows which way it leans, how heated the language is, and whether you’re reading reporting or someone’s argument. Give the demo below a link and watch it read a story you picked.',
  heroAdd: 'Add to your browser',
  heroDemo: 'See it read a story',
  simPlaceholder: 'Paste a link to a news story',
  simRead: 'Read it',
  simTryOne: 'Or try one:',
  simBlankTitle: 'Paste a link to a news story',
  simBlankBody:
    'The page opens here and Ground Truth reads it in the panel, exactly as it would in your own browser.',
  simCaption:
    'Real articles, actually read: paste any link, or take whatever an outlet is leading with. The demo fetches the page, pulls out its text and sends it to TypeSafe, which answers the same five questions the extension asks. Nothing about you is stored, and the number of reads is capped so it stays up. A YouTube link works too: it reads the transcript.',
  simUrlLabel: 'Link to an article',
  simNewTab: 'New tab',
  simPanelAria: 'Ground Truth side panel',
  simToggleAria: 'Toggle the Ground Truth panel',
  simNothingTitle: 'Nothing to show',
  simOpenOriginal: 'Open the original ↗',
  simTranscript: 'Transcript',
  idleTitle: 'Nothing to read yet',
  idleBody: 'Paste a link to a news story in the address bar above and Ground Truth reads it.',
  featuresTitle: 'The part you’d otherwise have to do yourself',
  featuresLede:
    'Whose story is this, and how is it being told? You can usually work it out by the fourth paragraph. This just gets you there sooner.',
  feature1Title: 'A split, not a label',
  feature1Body:
    'Most stories aren’t all one thing. You get the share that reads left, center and right — not a single stamp on the whole piece.',
  feature2Title: 'Nothing to press',
  feature2Body:
    'Open a story and it’s already read. The toolbar icon shows the lean at a glance; the panel has the rest when you want it.',
  feature3Title: 'Says when it’s torn',
  feature3Body:
    'When a piece pulls both ways, it says so, instead of splitting the difference and calling it balanced.',
  feature4Title: 'Points you elsewhere',
  feature4Body:
    'One click opens the same story as other outlets told it. Use it to start the argument, not to end it.',
  bandTitle: 'It never sees where else you’ve been.',
  bandLede:
    'Ground Truth reads the page you have open, and only to answer the question on screen. There’s no account, nothing of yours is stored, and what it read is gone when you close the browser. You choose which sites it works on — all of them, or a short list. The demo above works the same way: it fetches the link you hand it, and keeps nothing else.',
  bandCta: 'Add it to your browser',
  footerLine: 'A read of how one article is written — not a score for the outlet that published it.',
  footerPrivacy: 'Privacy',
  languageLabel: 'Language',
  errAddress: 'That doesn’t look like a web address.',
  errBlocked: 'That site turned us away — many outlets block automated readers.',
  errUnreachable: 'That site couldn’t be reached.',
  errNotPage: 'That address isn’t a web page.',
  errThin: 'There isn’t enough article text on that page to read.',
  errCaptions: 'That video has no captions, so there’s nothing to read.',
  errRate: 'That’s a lot of articles in a row. Give it a few minutes and try again.',
  errDaily: 'The demo has hit its reading limit for today. It resets tomorrow.',
  errService: 'The reading itself failed. It’s usually temporary.',
  errUnknown: 'That page couldn’t be read.'
}

const es: SiteCopy = {
  metaTitle: 'Ground Truth — mirá con qué enfoque está escrita la nota que estás leyendo',
  metaDescription:
    'Una extensión que lee la nota de tu pestaña y te muestra para dónde se inclina —izquierda, centro o derecha—, qué tan cargado está el lenguaje y si es información u opinión.',
  navDemo: 'Demo',
  navGet: 'Instalar',
  tagline: 'Un chequeo de sesgo para lo que estés leyendo',
  heroTitle: 'Mirá con qué enfoque está escrita la nota que estás leyendo.',
  heroLede:
    'Ground Truth se pone al lado de la nota y te muestra para dónde se inclina, cuánto se calienta el tono y si estás leyendo información o el argumento de alguien. Pegale un link a la demo de acá abajo y miralo trabajar sobre una nota que elijas vos.',
  heroAdd: 'Agregar al navegador',
  heroDemo: 'Verlo leer una nota',
  simPlaceholder: 'Pegá el link de una noticia',
  simRead: 'Leer',
  simTryOne: 'O probá con una:',
  simBlankTitle: 'Pegá el link de una noticia',
  simBlankBody:
    'La página se abre acá y Ground Truth la lee en el panel, igual que lo haría en tu navegador.',
  simCaption:
    'Notas reales, leídas de verdad: pegá cualquier link o agarrá lo que un medio tiene hoy en tapa. Se baja la página, se saca el texto y TypeSafe lo lee con las mismas cinco preguntas que usa la extensión. No se guarda nada tuyo y la cantidad de lecturas está limitada para que la demo siga en pie. Un link de YouTube también sirve: lee la transcripción.',
  simUrlLabel: 'Link a una nota',
  simNewTab: 'Nueva pestaña',
  simPanelAria: 'Panel lateral de Ground Truth',
  simToggleAria: 'Mostrar u ocultar el panel de Ground Truth',
  simNothingTitle: 'Nada para mostrar',
  simOpenOriginal: 'Abrir el original ↗',
  simTranscript: 'Transcripción',
  idleTitle: 'Todavía no leíste ninguna nota',
  idleBody: 'Pegá el link de una noticia en la barra de arriba y Ground Truth la lee.',
  featuresTitle: 'El trabajo que, si no, te toca a vos',
  featuresLede:
    '¿De quién es esta historia y cómo te la están contando? Para el cuarto párrafo ya te das cuenta. Esto te ahorra esos párrafos.',
  feature1Title: 'Porcentajes, no etiquetas',
  feature1Body:
    'Casi ninguna nota es una sola cosa. Ves qué parte se lee como izquierda, centro y derecha, en vez de una etiqueta única para todo el texto.',
  feature2Title: 'Funciona solo',
  feature2Body:
    'Abrís una nota y ya está analizada. El ícono de la barra te muestra la inclinación de un vistazo y el panel te guarda el detalle para cuando lo quieras.',
  feature3Title: 'Avisa cuando hay señales mezcladas',
  feature3Body:
    'Cuando una nota tira para los dos lados, te lo dice, en vez de promediar las dos puntas y llamarlo equilibrio.',
  feature4Title: 'Te lleva a otras coberturas',
  feature4Body:
    'A un clic tenés la misma historia contada por otros medios. La lectura sirve para abrir la discusión, no para cerrarla.',
  bandTitle: 'No tiene acceso a tu historial de navegación.',
  bandLede:
    'Ground Truth lee la página que tenés abierta, y solo para responder lo que ves en pantalla. No hay cuenta, no se guarda nada tuyo y lo que leyó se borra cuando cerrás el navegador. Vos elegís en qué sitios funciona: en todos o en una lista corta. La demo de arriba juega con las mismas reglas: baja el link que le das y no se queda con nada más.',
  bandCta: 'Agregarlo al navegador',
  footerLine:
    'Una lectura de cómo está escrita una nota, no una calificación al medio que la publicó.',
  footerPrivacy: 'Privacidad',
  languageLabel: 'Idioma',
  errAddress: 'Esto no parece una dirección web.',
  errBlocked: 'El sitio nos rechazó: muchos medios bloquean a los lectores automáticos.',
  errUnreachable: 'No pudimos entrar a ese sitio.',
  errNotPage: 'Esa dirección no es una página web.',
  errThin: 'Esa página no tiene suficiente texto para leer.',
  errCaptions: 'Ese video no tiene subtítulos, así que no hay nada para leer.',
  errRate: 'Son muchas notas seguidas. Esperá unos minutos y probá de nuevo.',
  errDaily: 'La demo llegó al límite de lecturas de hoy. Mañana se renueva.',
  errService: 'Falló la lectura. Casi siempre es pasajero.',
  errUnknown: 'No se pudo leer esa página.'
}

const de: SiteCopy = {
  metaTitle: 'Ground Truth — sieh, wie der Artikel erzählt ist, den du gerade liest',
  metaDescription:
    'Eine Browser-Erweiterung, die den Artikel in deinem Tab liest: wohin er neigt (links, Mitte, rechts), wie aufgeladen die Sprache ist und ob es Bericht oder Meinung ist.',
  navDemo: 'Demo',
  navGet: 'Installieren',
  tagline: 'Der Bias-Check für alles, was du liest',
  heroTitle: 'Sieh, wie der Artikel erzählt ist, den du gerade liest.',
  heroLede:
    'Ground Truth liegt neben dem Artikel und zeigt, wohin er neigt, wie hitzig die Sprache wird und ob du Bericht oder Meinung vor dir hast. Gib der Demo unten einen Link und sieh ihr bei einem Artikel deiner Wahl zu.',
  heroAdd: 'Zum Browser hinzufügen',
  heroDemo: 'Sieh ihr beim Lesen zu',
  simPlaceholder: 'Link zu einem Artikel einfügen',
  simRead: 'Lesen',
  simTryOne: 'Oder nimm einen:',
  simBlankTitle: 'Link zu einem Artikel einfügen',
  simBlankBody:
    'Die Seite erscheint hier, Ground Truth liest sie im Panel — genau wie in deinem eigenen Browser.',
  simCaption:
    'Echte Artikel, wirklich gelesen: füge einen Link ein oder nimm den Aufmacher eines Mediums. Die Seite wird geholt, der Text herausgelöst und von TypeSafe gelesen — dieselben fünf Fragen wie in der Erweiterung. Über dich wird nichts gespeichert, und die Zahl der Lesungen ist begrenzt, damit die Demo online bleibt. Ein YouTube-Link geht auch: dann liest sie die Untertitel.',
  simUrlLabel: 'Link zu einem Artikel',
  simNewTab: 'Neuer Tab',
  simPanelAria: 'Ground-Truth-Seitenpanel',
  simToggleAria: 'Ground-Truth-Panel ein- oder ausblenden',
  simNothingTitle: 'Nichts anzuzeigen',
  simOpenOriginal: 'Original öffnen ↗',
  simTranscript: 'Transkript',
  idleTitle: 'Noch nichts gelesen',
  idleBody: 'Füge oben einen Artikel-Link ein, dann liest Ground Truth ihn.',
  featuresTitle: 'Die Arbeit, die du dir sonst selbst machst',
  featuresLede:
    'Wessen Geschichte ist das, und wie wird sie erzählt? Nach dem vierten Absatz weißt du es meistens — hier eben schon vorher.',
  feature1Title: 'Eine Aufteilung statt eines Stempels',
  feature1Body:
    'Kaum ein Artikel ist nur eines. Du siehst, welcher Anteil sich links, mittig und rechts liest, statt eines Urteils über den ganzen Text.',
  feature2Title: 'Kein Knopf nötig',
  feature2Body:
    'Artikel öffnen genügt — gelesen ist er schon. Das Symbol in der Leiste zeigt die Neigung, das Panel den Rest.',
  feature3Title: 'Sagt, wenn es kippt',
  feature3Body:
    'Zieht ein Text in beide Richtungen, steht das da — statt die Mitte auszurechnen und sie ausgewogen zu nennen.',
  feature4Title: 'Zeigt, wie andere berichten',
  feature4Body:
    'Ein Klick, und dieselbe Geschichte steht da, wie andere Medien sie erzählt haben. Ein Anfang für die Diskussion, kein Schlusswort.',
  bandTitle: 'Was du sonst liest, sieht es nicht.',
  bandLede:
    'Ground Truth liest die Seite, die offen ist, und nur für die Frage auf dem Bildschirm. Kein Konto, nichts von dir wird gespeichert, und mit dem Browser ist auch das Gelesene weg. Du bestimmst, wo es arbeitet: überall oder auf einer kurzen Liste. Die Demo oben hält sich an dieselbe Regel — sie holt den Link, den du ihr gibst, mehr bleibt nicht.',
  bandCta: 'Zum Browser hinzufügen',
  footerLine:
    'Eine Einschätzung, wie ein Artikel geschrieben ist — keine Note für das Medium dahinter.',
  footerPrivacy: 'Datenschutz',
  languageLabel: 'Sprache',
  errAddress: 'Das sieht nicht nach einer Webadresse aus.',
  errBlocked: 'Die Seite hat uns abgewiesen — viele Medien sperren automatische Leser aus.',
  errUnreachable: 'Die Seite war nicht erreichbar.',
  errNotPage: 'Hinter der Adresse steckt keine Webseite.',
  errThin: 'Auf der Seite steht zu wenig Text zum Lesen.',
  errCaptions: 'Das Video hat keine Untertitel, also gibt es nichts zu lesen.',
  errRate: 'Das waren viele Artikel am Stück. Ein paar Minuten warten, dann geht es weiter.',
  errDaily: 'Die Demo hat ihr Tagespensum erreicht. Morgen wieder.',
  errService: 'Das Lesen hat nicht geklappt. Das legt sich meist von selbst.',
  errUnknown: 'Die Seite ließ sich nicht lesen.'
}

const fr: SiteCopy = {
  metaTitle: 'Ground Truth — voyez comment est écrit l’article que vous lisez',
  metaDescription:
    'Une extension qui lit l’article de votre onglet : de quel côté il penche (gauche, centre, droite), à quel point la langue est chargée, et s’il s’agit d’info ou d’opinion.',
  navDemo: 'Démo',
  navGet: 'Installer',
  tagline: 'Le décodeur de parti pris de vos lectures',
  heroTitle: 'Voyez comment est écrit l’article que vous lisez.',
  heroLede:
    'Ground Truth s’installe à côté de l’article et montre de quel côté il penche, si le ton monte, et si vous lisez un reportage ou une prise de position. Donnez un lien à la démo ci-dessous et regardez-la travailler sur l’article de votre choix.',
  heroAdd: 'Ajouter au navigateur',
  heroDemo: 'La voir à l’œuvre',
  simPlaceholder: 'Collez le lien d’un article',
  simRead: 'Lire',
  simTryOne: 'Ou prenez-en un :',
  simBlankTitle: 'Collez le lien d’un article',
  simBlankBody:
    'La page s’affiche ici et Ground Truth la lit dans le panneau, comme dans votre propre navigateur.',
  simCaption:
    'De vrais articles, vraiment lus : collez un lien, ou prenez la une d’un média. La page est récupérée, son texte extrait, puis lu par TypeSafe — les cinq mêmes questions que dans l’extension. Rien n’est conservé sur vous, et le nombre de lectures est plafonné pour que la démo tienne le coup. Un lien YouTube marche aussi : elle en lit la transcription.',
  simUrlLabel: 'Lien vers un article',
  simNewTab: 'Nouvel onglet',
  simPanelAria: 'Panneau latéral Ground Truth',
  simToggleAria: 'Afficher ou masquer le panneau Ground Truth',
  simNothingTitle: 'Rien à afficher',
  simOpenOriginal: 'Ouvrir l’original ↗',
  simTranscript: 'Transcription',
  idleTitle: 'Rien de lu pour l’instant',
  idleBody: 'Collez le lien d’un article dans la barre ci-dessus, Ground Truth s’en charge.',
  featuresTitle: 'Le travail que vous feriez à sa place',
  featuresLede:
    'À qui appartient cette histoire, et comment est-elle racontée ? Au quatrième paragraphe, vous avez compris. Ici, vous n’attendez pas jusque-là.',
  feature1Title: 'Une répartition, pas une étiquette',
  feature1Body:
    'Presque aucun article n’est d’un seul bloc. Vous voyez la part qui se lit à gauche, au centre et à droite, au lieu d’un verdict sur l’ensemble.',
  feature2Title: 'Aucun bouton',
  feature2Body:
    'Vous ouvrez l’article, il est déjà lu. L’icône de la barre donne le penchant ; le panneau garde le détail.',
  feature3Title: 'Le dit quand ça penche des deux côtés',
  feature3Body:
    'Quand un texte tire dans les deux sens, il l’annonce, au lieu de faire la moyenne et d’appeler ça de l’équilibre.',
  feature4Title: 'Vous envoie voir ailleurs',
  feature4Body:
    'Un clic, et la même histoire apparaît telle que d’autres médias l’ont racontée. De quoi ouvrir la discussion, pas la fermer.',
  bandTitle: 'Ce que vous lisez ailleurs, il ne le voit pas.',
  bandLede:
    'Ground Truth lit la page ouverte, et seulement pour répondre à ce qui s’affiche. Pas de compte, rien de vous n’est gardé, et ce qu’il a lu part avec le navigateur. Vous décidez où il travaille : partout, ou sur une courte liste. La démo ci-dessus suit la même règle — elle récupère le lien que vous lui donnez, et rien d’autre.',
  bandCta: 'L’ajouter au navigateur',
  footerLine:
    'Une lecture de la façon dont un article est écrit — pas une note pour le média qui le publie.',
  footerPrivacy: 'Confidentialité',
  languageLabel: 'Langue',
  errAddress: 'Cela ne ressemble pas à une adresse web.',
  errBlocked:
    'Le site nous a refusé l’entrée — beaucoup de médias bloquent les lecteurs automatiques.',
  errUnreachable: 'Impossible de joindre ce site.',
  errNotPage: 'Cette adresse ne mène pas à une page web.',
  errThin: 'Il y a trop peu de texte sur cette page pour la lire.',
  errCaptions: 'Cette vidéo n’a pas de sous-titres, il n’y a donc rien à lire.',
  errRate: 'Beaucoup d’articles d’affilée. Revenez dans quelques minutes.',
  errDaily: 'La démo a atteint son quota du jour. Elle repart demain.',
  errService: 'La lecture a échoué. Cela se règle en général tout seul.',
  errUnknown: 'Cette page n’a pas pu être lue.'
}

const it: SiteCopy = {
  metaTitle: 'Ground Truth — guarda com’è scritto l’articolo che stai leggendo',
  metaDescription:
    'Un’estensione che legge l’articolo nella tua scheda: da che parte pende (sinistra, centro, destra), quanto è carico il linguaggio e se è cronaca o opinione.',
  navDemo: 'Demo',
  navGet: 'Installa',
  tagline: 'Il controllo del taglio per tutto quello che leggi',
  heroTitle: 'Guarda com’è scritto l’articolo che stai leggendo.',
  heroLede:
    'Ground Truth si mette accanto all’articolo e mostra da che parte pende, quanto si alza il tono e se hai davanti cronaca o una tesi. Dai un link alla demo qui sotto e guardala lavorare su un articolo scelto da te.',
  heroAdd: 'Aggiungi al browser',
  heroDemo: 'Guardala all’opera',
  simPlaceholder: 'Incolla il link di un articolo',
  simRead: 'Leggi',
  simTryOne: 'Oppure prendine uno:',
  simBlankTitle: 'Incolla il link di un articolo',
  simBlankBody:
    'La pagina compare qui e Ground Truth la legge nel pannello, come farebbe nel tuo browser.',
  simCaption:
    'Articoli veri, letti davvero: incolla un link oppure prendi l’apertura di una testata. La pagina viene scaricata, il testo estratto e letto da TypeSafe con le stesse cinque domande dell’estensione. Di te non resta niente e il numero di letture è limitato, così la demo regge. Funziona anche un link di YouTube: ne legge i sottotitoli.',
  simUrlLabel: 'Link a un articolo',
  simNewTab: 'Nuova scheda',
  simPanelAria: 'Pannello laterale di Ground Truth',
  simToggleAria: 'Mostra o nascondi il pannello di Ground Truth',
  simNothingTitle: 'Niente da mostrare',
  simOpenOriginal: 'Apri l’originale ↗',
  simTranscript: 'Trascrizione',
  idleTitle: 'Ancora niente di letto',
  idleBody: 'Incolla il link di un articolo nella barra qui sopra e Ground Truth lo legge.',
  featuresTitle: 'Il lavoro che altrimenti tocca a te',
  featuresLede:
    'Di chi è questa storia e come te la stanno raccontando? Al quarto paragrafo l’hai capito. Qui non devi arrivarci.',
  feature1Title: 'Una ripartizione, non un’etichetta',
  feature1Body:
    'Quasi nessun articolo è tutto d’un pezzo. Vedi quanta parte si legge a sinistra, al centro e a destra, invece di un giudizio unico.',
  feature2Title: 'Non c’è niente da premere',
  feature2Body:
    'Apri l’articolo ed è già letto. L’icona nella barra dà la pendenza, il pannello il resto.',
  feature3Title: 'Dice quando pende da entrambe le parti',
  feature3Body:
    'Se un testo tira da tutte e due, lo dichiara, invece di fare la media e chiamarla equilibrio.',
  feature4Title: 'Ti manda a vedere altrove',
  feature4Body:
    'Un clic e trovi la stessa storia raccontata da altre testate. Un punto di partenza per discutere, non una sentenza.',
  bandTitle: 'Non sa che altro stai leggendo.',
  bandLede:
    'Ground Truth legge la pagina che hai aperto, e solo per rispondere a quello che vedi. Nessun account, niente di tuo viene conservato, e con il browser se ne va anche quello che ha letto. Decidi tu dove lavora: ovunque o su un elenco breve. La demo qui sopra segue la stessa regola: scarica il link che le dai, nient’altro.',
  bandCta: 'Aggiungila al browser',
  footerLine:
    'Una lettura di come è scritto un articolo, non un voto alla testata che lo pubblica.',
  footerPrivacy: 'Privacy',
  languageLabel: 'Lingua',
  errAddress: 'Questo non sembra un indirizzo web.',
  errBlocked: 'Il sito ci ha respinti: molte testate bloccano i lettori automatici.',
  errUnreachable: 'Non siamo riusciti a raggiungere il sito.',
  errNotPage: 'Quell’indirizzo non porta a una pagina web.',
  errThin: 'In quella pagina c’è troppo poco testo da leggere.',
  errCaptions: 'Quel video non ha sottotitoli, quindi non c’è niente da leggere.',
  errRate: 'Sono tanti articoli di fila. Riprova tra qualche minuto.',
  errDaily: 'La demo ha esaurito le letture di oggi. Domani riparte.',
  errService: 'La lettura non è riuscita. Di solito passa da sola.',
  errUnknown: 'Non è stato possibile leggere quella pagina.'
}

const pt: SiteCopy = {
  metaTitle: 'Ground Truth — vê como está escrito o artigo que estás a ler',
  metaDescription:
    'Uma extensão que lê o artigo do teu separador: para que lado pende (esquerda, centro, direita), quão carregada é a linguagem e se é notícia ou opinião.',
  navDemo: 'Demo',
  navGet: 'Instalar',
  tagline: 'A verificação de viés para tudo o que lês',
  heroTitle: 'Vê como está escrito o artigo que estás a ler.',
  heroLede:
    'O Ground Truth fica ao lado do artigo e mostra para que lado pende, se o tom aquece e se tens à frente reportagem ou uma posição. Dá um link à demo aqui abaixo e vê-a trabalhar num artigo escolhido por ti.',
  heroAdd: 'Adicionar ao navegador',
  heroDemo: 'Vê-la a trabalhar',
  simPlaceholder: 'Cola o link de um artigo',
  simRead: 'Ler',
  simTryOne: 'Ou escolhe um:',
  simBlankTitle: 'Cola o link de um artigo',
  simBlankBody:
    'A página aparece aqui e o Ground Truth lê-a no painel, tal como faria no teu navegador.',
  simCaption:
    'Artigos reais, lidos a sério: cola um link ou usa a manchete de um meio. A página é descarregada, o texto extraído e lido pelo TypeSafe com as mesmas cinco perguntas da extensão. De ti não fica nada, e o número de leituras é limitado para a demo aguentar. Um link do YouTube também serve: lê a transcrição.',
  simUrlLabel: 'Link para um artigo',
  simNewTab: 'Novo separador',
  simPanelAria: 'Painel lateral do Ground Truth',
  simToggleAria: 'Mostrar ou esconder o painel do Ground Truth',
  simNothingTitle: 'Nada para mostrar',
  simOpenOriginal: 'Abrir o original ↗',
  simTranscript: 'Transcrição',
  idleTitle: 'Ainda não há nada lido',
  idleBody: 'Cola o link de um artigo na barra acima e o Ground Truth lê-o.',
  featuresTitle: 'O trabalho que de outra forma é teu',
  featuresLede:
    'De quem é esta história e como te está a ser contada? Ao quarto parágrafo já percebeste. Aqui não precisas de esperar.',
  feature1Title: 'Uma divisão, não um rótulo',
  feature1Body:
    'Quase nenhum artigo é de uma peça só. Vês que parte se lê à esquerda, ao centro e à direita, em vez de um veredicto sobre tudo.',
  feature2Title: 'Não há nada para carregar',
  feature2Body:
    'Abres o artigo e já está lido. O ícone da barra dá a inclinação; o painel guarda o resto.',
  feature3Title: 'Diz quando pende para os dois lados',
  feature3Body:
    'Se um texto puxa para ambos, avisa, em vez de fazer a média e chamar-lhe equilíbrio.',
  feature4Title: 'Manda-te ver noutro sítio',
  feature4Body:
    'Um clique e aparece a mesma história contada por outros meios. Serve para abrir a discussão, não para a fechar.',
  bandTitle: 'Não sabe o que mais andas a ler.',
  bandLede:
    'O Ground Truth lê a página que tens aberta, e só para responder ao que está no ecrã. Não há conta, nada de teu é guardado, e o que leu vai-se embora com o navegador. Decides tu onde trabalha: em todo o lado ou numa lista curta. A demo acima segue a mesma regra: descarrega o link que lhe dás, mais nada.',
  bandCta: 'Adicionar ao navegador',
  footerLine: 'Uma leitura de como um artigo está escrito — não uma nota ao meio que o publicou.',
  footerPrivacy: 'Privacidade',
  languageLabel: 'Idioma',
  errAddress: 'Isto não parece um endereço web.',
  errBlocked: 'O site recusou-nos — muitos meios bloqueiam leitores automáticos.',
  errUnreachable: 'Não foi possível chegar a esse site.',
  errNotPage: 'Esse endereço não dá para uma página web.',
  errThin: 'Essa página tem pouco texto para ler.',
  errCaptions: 'Esse vídeo não tem legendas, por isso não há nada para ler.',
  errRate: 'São muitos artigos seguidos. Tenta daqui a uns minutos.',
  errDaily: 'A demo esgotou as leituras de hoje. Amanhã recomeça.',
  errService: 'A leitura falhou. Costuma resolver-se sozinha.',
  errUnknown: 'Não foi possível ler essa página.'
}

export const SITE: Record<string, SiteCopy> = {en, es, de, fr, it, pt}
