import type {Analysis, Article} from './typesafe'

/** Per-tab result, kept in chrome.storage.session under tabKey(tabId). The sidebar just renders it. */
export type TabState =
  | {status: 'analyzing'; article: Article}
  | {status: 'done'; article: Article; analysis: Analysis}
  | {status: 'off'; article: Article} // site not in the Sites list
  | {status: 'empty'} // no readable article on the page
  | {status: 'nourl'} // no reading service address configured
  | {status: 'error'; article: Article; message: string}

export const tabKey = (tabId: number) => `tab:${tabId}`

export const envApiUrl = import.meta.env.EXTENSION_PUBLIC_API_URL

export async function getDomains() {
  const {domains} = await chrome.storage.local.get('domains')
  return (domains as string[] | undefined) ?? []
}

// A bundled .env address wins; the Settings field is only for builds without one.
export async function apiUrl() {
  if (envApiUrl) return envApiUrl
  const {apiUrl} = await chrome.storage.local.get('apiUrl')
  return (apiUrl as string) || ''
}
