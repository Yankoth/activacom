export function formatEventCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
