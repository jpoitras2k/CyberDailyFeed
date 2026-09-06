export function resolveFeedUrl(officialUrl: string, devProxyPath: string): string {
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    return devProxyPath;
  }
  return officialUrl;
}

export function isDevWebPreview(): boolean {
  return typeof window !== "undefined" && import.meta.env.DEV;
}
