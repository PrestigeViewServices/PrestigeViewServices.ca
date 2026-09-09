/**
 * Password suggestions for the admin sign-in forms.
 *
 * Deliberately dependency-free (Web Crypto only, no database imports) so it
 * can run in a client component as well as on the server.
 */

// No look-alike characters (0/O, 1/l/I) — these passwords get read aloud
// over the phone and typed on a phone keyboard in a truck.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A 20-character password in 4 readable groups, e.g. `kR4wq-...`. */
export function suggestPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  const groups: string[] = [];
  for (let i = 0; i < chars.length; i += 5) {
    groups.push(chars.slice(i, i + 5).join(""));
  }
  return groups.join("-");
}
