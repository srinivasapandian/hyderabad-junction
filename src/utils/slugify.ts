/**
 * toSlug — converts a display name into a URL-safe slug
 * e.g. "Bollywood Bites" → "bollywood-bites"
 */
export function toSlug(str = ''): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * fromSlug — converts a slug back to a display-friendly name
 * e.g. "bollywood-bites" → "Bollywood Bites"
 */
export function fromSlug(slug = ''): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
