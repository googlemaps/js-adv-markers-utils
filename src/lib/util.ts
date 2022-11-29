const warnings = new Set();

export function warnOnce(message: string, ...params: unknown[]) {
  if (warnings.has(message)) return;

  warnings.add(message);
  if (typeof console !== 'undefined') {
    console.warn(message, ...params);
  }
}

export function assertNotNull<TValue>(
  value: TValue,
  message: string = 'assertion failed'
): asserts value is NonNullable<TValue> {
  if (value === null || value === undefined) {
    throw Error(message);
  }
}
