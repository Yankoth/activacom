const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I, O, 0, 1

export function generateEventCode(length = 8): string {
  const values = crypto.getRandomValues(new Uint8Array(length));
  let code = '';
  for (const v of values) {
    code += ALPHABET[v % ALPHABET.length];
  }
  return code;
}
