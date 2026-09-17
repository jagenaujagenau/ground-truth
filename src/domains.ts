/** Turn free-form input ("https://www.NYTimes.com/x, bbc.co.uk") into bare domains. */
export function parseDomains(input: string): string[] {
  const domains = input
    .split(/[\s,]+/)
    .map((d) =>
      d
        .trim()
        .toLowerCase()
        .replace(/^[a-z]+:\/\//, '')
        .replace(/[/:?#].*$/, '')
        .replace(/^www\./, '')
    )
    .filter((d) => d.includes('.'))
  return [...new Set(domains)]
}

/** Empty list = every site. A domain also covers its subdomains. */
export function isAllowed(hostname: string, domains: string[]) {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  return domains.length === 0 || domains.some((d) => host === d || host.endsWith(`.${d}`))
}
