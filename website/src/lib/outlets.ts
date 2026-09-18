/**
 * The outlets offered as one-click examples, per language: a reader on the Spanish page is handed
 * Spanish-language papers, not American ones. Each set spans the spectrum where the feeds allow it,
 * because a demo that reads four papers of the same stripe shows nothing.
 *
 * Only outlets whose feeds list real articles and whose pages can actually be read are listed;
 * plenty of papers (Le Monde, Welt, Expresso) block automated readers or put the text behind a wall.
 */
import FILES from './outlet-icons.json'

export type Outlet = {
  id: string
  label: string
  feed: string
  /** The site itself: the buttons show its favicon, and /favicon.ico is the usual place. */
  site: string
  /** Where the icon really is, for the three that answer /favicon.ico with a 403 or an HTML stub. */
  icon?: string
}

export const OUTLETS: Record<string, Outlet[]> = {
  en: [
    {id: 'npr', label: 'NPR', site: 'npr.org', feed: 'https://feeds.npr.org/1014/rss.xml'},
    {
      id: 'fox',
      label: 'Fox News',
      site: 'foxnews.com',
      feed: 'https://moxie.foxnews.com/google-publisher/politics.xml'
    },
    {
      id: 'guardian',
      label: 'The Guardian',
      site: 'theguardian.com',
      feed: 'https://www.theguardian.com/us-news/rss'
    },
    {id: 'bbc', label: 'BBC', site: 'bbc.co.uk', feed: 'https://feeds.bbci.co.uk/news/world/rss.xml'}
  ],
  es: [
    {
      id: 'clarin',
      label: 'Clarín',
      site: 'clarin.com',
      icon: 'https://www.clarin.com/img/favicon/apple-icon-76x76.png',
      feed: 'https://www.clarin.com/rss/politica/'
    },
    {
      id: 'lanacion',
      label: 'La Nación',
      site: 'lanacion.com.ar',
      feed: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/politica/'
    },
    {
      id: 'infobae',
      label: 'Infobae',
      site: 'infobae.com',
      icon: 'https://www.infobae.com/pf/resources/favicon/favicon-32x32.png?d=4440',
      feed: 'https://www.infobae.com/arc/outboundfeeds/rss/category/politica/'
    },
    {
      id: 'elpais',
      label: 'El País',
      site: 'elpais.com',
      icon: 'https://static.elpais.com/dist/resources/images/favicon_96.png',
      feed: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada'
    }
  ],
  de: [
    {id: 'taz', label: 'taz', site: 'taz.de', feed: 'https://taz.de/!p4608;rss/'},
    {
      id: 'spiegel',
      label: 'Spiegel',
      site: 'spiegel.de',
      feed: 'https://www.spiegel.de/politik/index.rss'
    },
    {
      id: 'tagesschau',
      label: 'tagesschau',
      site: 'tagesschau.de',
      feed: 'https://www.tagesschau.de/index~rss2.xml'
    },
    {id: 'faz', label: 'FAZ', site: 'faz.net', feed: 'https://www.faz.net/rss/aktuell/politik/'}
  ],
  fr: [
    {id: 'humanite', label: "L'Humanité", site: 'humanite.fr', feed: 'https://www.humanite.fr/rss'},
    {
      id: 'franceinfo',
      label: 'France Info',
      site: 'francetvinfo.fr',
      feed: 'https://www.francetvinfo.fr/politique.rss'
    },
    {
      id: 'figaro',
      label: 'Le Figaro',
      site: 'lefigaro.fr',
      feed: 'https://www.lefigaro.fr/rss/figaro_politique.xml'
    },
    {id: 'rfi', label: 'RFI', site: 'rfi.fr', feed: 'https://www.rfi.fr/fr/france/rss'}
  ],
  it: [
    {
      id: 'ilfatto',
      label: 'Il Fatto',
      site: 'ilfattoquotidiano.it',
      feed: 'https://www.ilfattoquotidiano.it/feed/'
    },
    {
      id: 'corriere',
      label: 'Corriere',
      site: 'corriere.it',
      feed: 'https://xml2.corriereobjects.it/rss/politica.xml'
    },
    {
      id: 'ansa',
      label: 'ANSA',
      site: 'ansa.it',
      feed: 'https://www.ansa.it/sito/notizie/politica/politica_rss.xml'
    }
  ],
  pt: [
    {
      id: 'observador',
      label: 'Observador',
      site: 'observador.pt',
      feed: 'https://observador.pt/feed/'
    },
    {id: 'rtp', label: 'RTP', site: 'rtp.pt', feed: 'https://www.rtp.pt/noticias/rss/pais'},
    {
      id: 'cnnpt',
      label: 'CNN Portugal',
      site: 'cnnportugal.iol.pt',
      feed: 'https://cnnportugal.iol.pt/rss'
    }
  ]
}

/** Where the icon is fetched FROM, when scripts/outlet-icons.mjs goes to collect them. */
export const iconSource = (outlet: Outlet) => outlet.icon ?? `https://${outlet.site}/favicon.ico`

/**
 * Where the page loads it from: our own origin. Visiting a page about not being watched should not
 * announce the visit to every masthead on it. Missing entry, no icon — the label carries it.
 */
export const iconOf = (outlet: Outlet) =>
  outlet.id in FILES ? `/outlets/${FILES[outlet.id as keyof typeof FILES]}` : undefined

/** The feed behind an outlet id, whatever language it belongs to. */
export const feedOf = (id: string) =>
  Object.values(OUTLETS)
    .flat()
    .find((o) => o.id === id)?.feed
