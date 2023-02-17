import type {LngLatArray} from './marker-attributes';

type PositionFormat<T> = {
  isValid(value: unknown): value is T;
  toLatLng(value: T): google.maps.LatLng;
  fromLatLng(value: google.maps.LatLng): T;
};

const LatLngFormat: PositionFormat<google.maps.LatLng> = {
  isValid(value: unknown): value is google.maps.LatLng {
    return typeof value === 'object' && value instanceof google.maps.LatLng;
  },

  fromLatLng(value: google.maps.LatLng): google.maps.LatLng {
    return value;
  },

  toLatLng(value: google.maps.LatLng): google.maps.LatLng {
    return value;
  }
};

const LngLatArrayFormat: PositionFormat<LngLatArray> = {
  isValid(value: unknown): value is LngLatArray {
    return Array.isArray(value) && value.length === 2;
  },

  fromLatLng(p: google.maps.LatLng): LngLatArray {
    return [p.lng(), p.lat()];
  },

  toLatLng(p: LngLatArray): google.maps.LatLng {
    return new google.maps.LatLng(p[1], p[0]);
  }
};

const LatLngLiteralFormat: PositionFormat<google.maps.LatLngLiteral> = {
  isValid(value: unknown): value is google.maps.LatLngLiteral {
    return (
      value !== null &&
      typeof value === 'object' &&
      'lat' in value &&
      'lng' in value
    );
  },

  fromLatLng(p: google.maps.LatLng): google.maps.LatLngLiteral {
    return p.toJSON();
  },

  toLatLng(p: google.maps.LatLngLiteral): google.maps.LatLng {
    return new google.maps.LatLng(p);
  }
};

/** Union type of all position-formats supported by the markers. */
export type Position =
  | google.maps.LatLngLiteral
  | google.maps.LatLng
  | LngLatArray;

/** The supported position-formats. */
export const positionFormats = [
  LatLngFormat,
  LngLatArrayFormat,
  LatLngLiteralFormat
];

/**
 * Returns the position-format for the specified datum.
 *
 * @param p
 */
export function getPositionFormat(p: Position): PositionFormat<typeof p> {
  for (const fmt of positionFormats) {
    if (fmt.isValid(p)) return fmt;
  }

  throw new Error('unknown position format');
}

/**
 * Converts the specified datum into the google.maps.LatLng format used
 * internally.
 *
 * @param p
 */
export function toLatLng(p: Position): google.maps.LatLng {
  return getPositionFormat(p).toLatLng(p);
}
