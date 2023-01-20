const warnings = new Set();

export function warnOnce(message: string, ...params: unknown[]) {
  if (warnings.has(message)) return;

  warnings.add(message);
  if (typeof console !== 'undefined') {
    console.warn(message, ...params);
  }
}

export function assertMapsApiLoaded() {
  if (!('google' in window) || !google.maps) {
    console.error(
      `Google Maps API couldn't be found. Please make sure ` +
        `to wait for the Google Maps API to load before creating markers.`
    );
    throw new Error('Google Maps API not found.');
  }

  if (google.maps && !google.maps.marker) {
    console.error(
      `Google Maps API was loaded without the required marker-library. ` +
        `To load it, add the '&libraries=marker' parameter to the API url ` +
        `or use \`await google.maps.importLibrary('marker');\` before creating ` +
        `a marker.`
    );
    throw new Error('Google Maps Marker Library not found.');
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
