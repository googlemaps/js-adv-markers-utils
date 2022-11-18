const warnings = new Set();

export function warnOnce(message: string, ...params: any[]) {
  if (warnings.has(message)) return;

  warnings.add(message);
  if (typeof console !== 'undefined') {
    console.warn(message, ...params);
  }
}
