export async function openOriginalArticle(url: string): Promise<void> {
  window.open(url, "_blank", "noopener,noreferrer");
}
