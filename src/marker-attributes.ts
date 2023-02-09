import type {CollisionBehavior, MarkerState} from './marker';
import type {MapState} from './map-state-observer';
import type {ComputedMarkerAttributes} from './computed-marker-attributes';

// These keys are used to create the dynamic properties (mostly to save us
// from having to type them all out and to make adding attributes a bit easier).
export const attributeKeys: readonly AttributeKey[] = [
  'position',
  'draggable',
  'collisionBehavior',
  'title',
  'zIndex',

  'color',
  'backgroundColor',
  'borderColor',
  'glyphColor',

  'icon',
  'glyph',
  'scale',

  'content',
  'classList'
] as const;

export type LngLatArray = [lng: number, lat: number];
export type Position =
  | google.maps.LatLngLiteral
  | google.maps.LatLng
  | {latitude: number; longitude: number}
  | LngLatArray;

/** StaticAttributes contains the base definition for all attribute-values. */
export interface StaticAttributes {
  /**
   * The position of the marker on the map, specified as
   * google.maps.LatLngLiteral.
   */
  position: Position;
  /**
   * Should the marker be draggable? In this case whatever value is written to
   * the position-attribute will be automatically overwritten by the maps-API
   * when the position changes.
   */
  draggable: boolean;
  collisionBehavior: CollisionBehavior;
  title: string;
  zIndex: number;

  color: string;
  backgroundColor: string;
  borderColor: string;
  glyphColor: string;
  icon: string;
  glyph: string | Element | URL;
  scale: number;

  content: HTMLElement;
  classList: string[];
}

// just the keys for all attributes
export type AttributeKey = keyof StaticAttributes;

/**
 * DynamicAttributeValues are functions that take a state object consisting of
 * internal state and user-data and return the attribute value. They are
 * evaluated whenever a state-change happens or user-data is updated.
 */
export type DynamicAttributeValue<TUserData, TAttr> = (
  state: {data: TUserData | null} & {
    map: MapState;
    marker: MarkerState;
    attr: ComputedMarkerAttributes<TUserData>;
  }
) => TAttr | undefined;

/** An AttributeValue can be either a static value of a dynamic attribute. */
export type AttributeValue<TUserData, T> =
  | T
  | DynamicAttributeValue<TUserData, T>;

/** Internally used to store the attributes with dynamic values separately. */
export type DynamicAttributes<T> = {
  [key in AttributeKey]: DynamicAttributeValue<T, StaticAttributes[key]>;
};

/**
 * These are the attribute-types as specified to the constructor and individual
 * attribute setters
 */
export type Attributes<T = unknown> = {
  [key in AttributeKey]: AttributeValue<T, StaticAttributes[key]>;
};
