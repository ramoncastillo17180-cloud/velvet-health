import { prisma } from "../lib/prisma";

// Normalizes arbitrary text into a URL-safe slug: lowercase, accent-stripped,
// and runs of non-alphanumeric characters collapsed to single hyphens.
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Server-generates a unique slug from a base string, appending a numeric suffix
// on collision. Slug generation is server-controlled; the client never picks
// the final stored value.
export async function generateUniqueSlug(base: string): Promise<string> {
  const normalized = slugify(base) || "curso";
  let candidate = normalized;
  let suffix = 2;
  while (await prisma.course.findUnique({ where: { slug: candidate } })) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
