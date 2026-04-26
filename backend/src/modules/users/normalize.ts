export function normalizeIdentifier(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

export function normalizeText(value: string): string {
  return value.normalize('NFKC').trim();
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}
