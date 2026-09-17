import type {Analysis, Article} from './typesafe'

/** Per-tab result, kept in chrome.storage.session under tabKey(tabId). The sidebar just renders it. */
export type TabState =
  | {status: 'analyzing'; article: Article}
  | {status: 'done'; article: Article; analysis: Analysis}
  | {status: 'off'; article: Article} // site not in the Sites list
  | {status: 'empty'} // no readable article on the page
  | {status: 'nokey'}
  | {status: 'error'; article: Article; message: string}

export const tabKey = (tabId: number) => `tab:${tabId}`

export const envKey = import.meta.env.EXTENSION_PUBLIC_TYPESAFE_API_KEY

export async function getDomains() {
  const {domains} = await chrome.storage.local.get('domains')
  return (domains as string[] | undefined) ?? []
}

// A bundled .env key wins; the Settings key is only for builds without one.
export async function apiKey() {
  if (envKey) return envKey
  const {apiKey} = await chrome.storage.local.get('apiKey')
  return (apiKey as string) || ''
}
