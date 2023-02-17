import type {CollisionBehavior, MarkerState} from './marker';
import type {MapState} from './map-state-observer';
import type {ComputedMarkerAttributes} from './computed-marker-attributes';
import type {Position} from './position-formats';

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

/** Array based position format as it is used in e.g. GeoJSON */
export type LngLatArray = [lng: number, lat: number];

/** StaticAttributes contains the base definition for all attribute-values. */
export type StaticAttributes = {
  /** {@inheritDoc Marker.position} */
  position: Position;
  /** {@inheritDoc Marker.draggable} */
  draggable: boolean;
  /** {@inheritDoc Marker.collisionBehavior} */
  collisionBehavior: CollisionBehavior;
  /** {@inheritDoc Marker.title} */
  title: string;
  /** {@inheritDoc Marker.zIndex} */
  zIndex: number;
  /** {@inheritDoc Marker.color} */
  color: string;
  /** {@inheritDoc Marker.backgroundColor} */
  backgroundColor: string;
  /** {@inheritDoc Marker.borderColor} */
  borderColor: string;
  /** {@inheritDoc Marker.glyphColor} */
  glyphColor: string;
  /** {@inheritDoc Marker.icon} */
  icon: string;
  /** {@inheritDoc Marker.glyph} */
  glyph: string | Element | URL;
  /** {@inheritDoc Marker.scale} */
  scale: number;
  /** {@inheritDoc Marker.content} */
  content: HTMLElement;
  /** {@inheritDoc Marker.classList} */
  classList: string | string[];
};

/** Keys for all attributes. */
export type AttributeKey = keyof StaticAttributes;

/**
 * DynamicAttributeValues are functions that take a state object consisting of
 * internal state and user-data and return the attribute value. They are
 * evaluated whenever a state-change happens or user-data is updated.
 *
 * @typeParam TUserData - The type of the user-specified data passed to
 *   `setData()` and made available in the arguments of the dynamic attribute
 *   callbacks.
 * @typeParam TAttr - The type of the attribute-value.
 */
export type DynamicAttributeValue<TUserData, TAttr> = (
  state: {data: TUserData | null} & {
    map: MapState;
    marker: MarkerState;
    attr: ComputedMarkerAttributes<TUserData>;
  }
) => TAttr | undefined;

/**
 * An AttributeValue can be either a static value of a dynamic attribute.
 *
 * @typeParam TUserData - The type of the user-specified data passed to
 *   `setData()` and made available in the arguments of the dynamic attribute
 *   callbacks.
 * @typeParam TAttr - The type of the attribute-value.
 */
export type AttributeValue<TUserData, TAttr> =
  | TAttr
  | DynamicAttributeValue<TUserData, TAttr>;

/**
 * Internally used to store the attributes with dynamic values separately.
 *
 * @typeParam TUserData - The type of the user-specified data passed to
 *   `setData()` and made available in the arguments of the dynamic attribute
 *   callbacks.
 */
export type DynamicAttributes<TUserData> = {
  [key in AttributeKey]: DynamicAttributeValue<
    TUserData,
    StaticAttributes[key]
  >;
};

/**
 * These are the attribute-types as specified to the constructor and individual
 * attribute setters
 *
 * @typeParam TUserData - The type of the user-specified data passed to
 *   `setData()` and made available in the arguments of the dynamic attribute
 *   callbacks.
 */
export type Attributes<TUserData = unknown> = {
  [key in AttributeKey]: AttributeValue<TUserData, StaticAttributes[key]>;
};
