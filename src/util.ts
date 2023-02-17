const warnings = new Set();

/**
 * Prints the specified message to the console the first time it is called with
 * the message.
 *
 * @param message
 * @param params
 */
export function warnOnce(message: string, ...params: unknown[]) {
  if (warnings.has(message)) return;

  warnings.add(message);
  if (typeof console !== 'undefined') {
    console.warn(message, ...params);
  }
}

/**
 * Verifies that the Google Maps API is properly loaded and throws an exception
 * if it isn't.
 */
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

/**
 * A typescript assertion function used in cases where typescript has to be
 * convinced that the object in question can not be null.
 *
 * @param value
 * @param message
 */
export function assertNotNull<TValue>(
  value: TValue,
  message: string = 'assertion failed'
): asserts value is NonNullable<TValue> {
  if (value === null || value === undefined) {
    throw Error(message);
  }
}
