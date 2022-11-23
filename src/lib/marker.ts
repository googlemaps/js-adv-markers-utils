import {
  adjustLightness,
  luminance,
  parseCssColorValue,
  rgbaToString
} from './color';
import {assertNotNull, warnOnce} from './util';

import type {IconProvider} from './icons';

type TUserDataDefault = Record<string, unknown>;

// These keys are used to create the dynamic properties (mostly to save us
// from having to type them all out and to make adding attributes a bit easier).
const attributeKeys: readonly AttributeKey[] = [
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
  'scale'
] as const;

/**
 * The Marker class.
 * The optional type-parameter TUserData can be used to specify a type to
 * be used for the data specified in setData and available in the dynamic
 * attribute callbacks.
 */
export class Marker<TUserData extends object = TUserDataDefault> {
  private static iconProviders: Map<string, IconProvider> = new Map();
  static registerIconProvider(
    provider: IconProvider,
    namespace: string = 'default'
  ) {
    Marker.iconProviders.set(namespace, provider);
  }

  // attributes are only declared here, they are dynamically added to the
  // prototype below the class-declaration
  declare position?: Attributes<TUserData>['position'];
  declare draggable?: Attributes<TUserData>['draggable'];
  declare collisionBehavior?: Attributes<TUserData>['collisionBehavior'];
  declare title?: Attributes<TUserData>['title'];
  declare zIndex?: Attributes<TUserData>['zIndex'];

  declare glyph?: Attributes<TUserData>['glyph'];
  declare scale?: Attributes<TUserData>['scale'];
  declare color?: Attributes<TUserData>['color'];
  declare backgroundColor?: Attributes<TUserData>['backgroundColor'];
  declare borderColor?: Attributes<TUserData>['borderColor'];
  declare glyphColor?: Attributes<TUserData>['glyphColor'];
  declare icon?: Attributes<TUserData>['icon'];

  // since updates can be triggered in multiple ways, we store the last
  // known state of the three contributing sources
  private data_: TUserData | null = null;
  private markerState_: MarkerState = {visible: false};
  private mapState_: MapState | null = null;

  // attributes set by the user are stored in attributes_ and
  // dynamicAttributes_.
  readonly attributes_: Partial<StaticAttributes> = {};
  readonly dynamicAttributes_: Partial<DynamicAttributes<TUserData>> = {};
  readonly computedAttributes_ = new ComputedMarkerAttributes(this);

  private mapEventListener_: google.maps.MapsEventListener | null = null;

  // AdvancedMarkerView and PinView instances used to render the marker
  private markerView_: google.maps.marker.AdvancedMarkerView;
  private pinView_: google.maps.marker.PinView;

  // internal flag to prevent multiple updates in the same execution frame
  // (updates start as microtasks after being requested)
  private updateScheduled_: boolean = false;

  /**
   * Creates a new marker instance.
   * Markers can be created without any options, or with any number of
   * attributes set.
   *
   * @param options
   * @param data
   */
  constructor(options: MarkerOptions<TUserData> = {}, data?: TUserData) {
    const {map, ...attributes} = options;

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
          `To load it, add the '&libraries=marker' parameter to the API url.`
      );
      throw new Error('Google Maps Marker Library not found.');
    }

    this.data_ = data || null;
    this.pinView_ = new google.maps.marker.PinView();
    this.markerView_ = new google.maps.marker.AdvancedMarkerView();
    this.markerView_.content = this.pinView_.element;

    // set all remaining parameters as attributes
    for (const [key, value] of Object.entries(attributes)) {
      this.setAttribute_(key as AttributeKey, value);
    }

    if (map) {
      this.map = map;
      this.scheduleUpdate();
    }
  }

  /**
   * Sets the data for this marker and triggers an update.
   * @param data
   */
  setData(data: TUserData) {
    this.data_ = data;

    this.scheduleUpdate();
  }

  /**
   * Adds an event-listener to this marker.
   * @param eventName 'click', 'dragstart', 'dragend', 'drag'
   * @param handler
   */
  addListener(
    eventName: string,
    handler: (ev: google.maps.MapMouseEvent) => void
  ): google.maps.MapsEventListener {
    return this.markerView_.addListener(eventName, handler);
  }

  /**
   * The map property is a proxy for this.markerView_.map, setting the map
   * will also retrieve the view-state from the map and update the marker.
   */
  get map(): google.maps.Map | null {
    return this.markerView_.map || null;
  }

  set map(map: google.maps.Map | null) {
    if (this.markerView_.map === map) {
      return;
    }

    if (this.mapEventListener_) {
      this.mapEventListener_.remove();
      this.mapEventListener_ = null;
    }

    this.markerView_.map = map;

    if (map) {
      this.mapEventListener_ = map.addListener('bounds_changed', () =>
        this.onMapBoundsChange(map)
      );

      this.onMapBoundsChange(map);
      this.scheduleUpdate();
    }
  }

  /**
   * Internal function to set attribute values. Splits specified attributes
   * into static and dynamic attributes and triggers an update.
   * @param name
   * @param value
   * @internal
   */
  setAttribute_<
    TKey extends AttributeKey,
    TValue extends Attributes<TUserData>[TKey]
  >(name: TKey, value: TValue) {
    // update the marker when we're done
    this.scheduleUpdate();

    if (typeof value === 'function') {
      this.dynamicAttributes_[name] =
        value as DynamicAttributes<TUserData>[TKey];
    } else {
      this.attributes_[name] = value as StaticAttributes[TKey];
      delete this.dynamicAttributes_[name];
    }
  }

  /**
   * Internal method to get the attribute value as it was specified by
   * the user (e.g. will return the dynamic attribute function instead of the
   * effective value).
   * @param name
   * @internal
   */
  getAttribute_<TKey extends AttributeKey>(
    name: TKey
  ): Attributes<TUserData>[TKey] {
    return (
      (this.dynamicAttributes_[name] as DynamicAttributes<TUserData>[TKey]) ||
      (this.attributes_[name] as StaticAttributes[TKey])
    );
  }

  /**
   * Schedules an update via microtask. This makes sure that we won't
   * run multiple updates when multiple attributes are changed sequentially.
   * @internal
   */
  private scheduleUpdate() {
    if (this.updateScheduled_) return;

    this.updateScheduled_ = true;
    queueMicrotask(() => {
      this.updateScheduled_ = false;
      this.update();
    });
  }

  /**
   * Updates the rendered objects for this marker, typically an
   * AdvancedMarkerView and PinView.
   * This method is called very often, so it is critical to keep it as
   * performant as possible:
   *  - avoid object allocations if possible
   *  - avoid expensive computations. These can likely be moved into
   *    setAttribute_ or the ComputedMarkerAttributes class
   * @internal
   */
  update() {
    if (!this.map || !this.mapState_) {
      console.warn('marker update skipped: missing map or mapState');
      return;
    }

    const attrs = this.computedAttributes_;

    this.updatePinViewColors(attrs);

    // FIXME: in cases where there's an `if` here, we need to make sure that
    //   state updates might require us to reset the state (i.e. icon changes
    //   from 'some-icon' to undefined).

    // FIXME: how to handle undefined values? Should we skip those?
    //  Or have fixed defaults for everything?

    this.markerView_.position = attrs.position;
    this.markerView_.draggable = attrs.draggable;
    this.markerView_.title = attrs.title;
    this.markerView_.zIndex = attrs.zIndex;
    this.markerView_.collisionBehavior = attrs.collisionBehavior;
    this.pinView_.scale = attrs.scale;

    if (attrs.icon) {
      let namespace = 'default';
      let iconId = attrs.icon;

      if (attrs.icon.includes(':')) {
        [namespace, iconId] = attrs.icon.split(':');
      }

      const provider = Marker.iconProviders.get(namespace);
      if (provider) {
        this.pinView_.glyph = provider(iconId);
      } else {
        const nsText =
          namespace === 'default' ? '' : `with namespace '${namespace}' `;

        warnOnce(
          `An icon is set but no icon provider ${nsText}is configured.\n` +
            `You can register an icon-provider using e.g. ` +
            `\`Marker.iconProvider = MaterialIcons()\` to use the material ` +
            `icons webfont.`
        );
      }
    } else if (attrs.glyph) {
      this.pinView_.glyph = attrs.glyph;
    }
  }

  /**
   * Updates the colors for the embedded pin-view based on the different
   * color attributes.
   * @param attributes
   */
  private updatePinViewColors(attributes: Partial<StaticAttributes>) {
    let {color, backgroundColor, borderColor, glyphColor} = attributes;

    if (color) {
      const rgba = parseCssColorValue(color);
      const rgbaDark = adjustLightness(rgba, 0.75);
      const rgbaDarker = adjustLightness(rgba, 0.5);
      const rgbaLighter = adjustLightness(rgba, 2.5);

      if (!backgroundColor) backgroundColor = rgbaToString(rgba);
      if (!borderColor) borderColor = rgbaToString(rgbaDark);

      if (!glyphColor) {
        // when a glyph is specified, we'll use a lightened/darkened
        // version of the color, when there's no glyph, we'll use the
        // border-color instead
        glyphColor =
          this.icon || this.glyph
            ? rgbaToString(luminance(rgba) > 0.4 ? rgbaDarker : rgbaLighter)
            : borderColor;
      }
    }

    this.pinView_.background = backgroundColor;
    this.pinView_.borderColor = borderColor;
    this.pinView_.glyphColor = glyphColor;
  }

  /**
   * Handles the bounds_changed event for the map to update our internal state.
   * @param map
   */
  private onMapBoundsChange = (map: google.maps.Map) => {
    const center = map.getCenter();
    const bounds = map.getBounds();

    if (!center || !bounds) {
      console.error(
        'Marker.onMapBoundsChange(): map center and/or bounds undefined.' +
          ' Not updating map state.'
      );

      return;
    }

    this.mapState_ = {
      center,
      bounds,
      zoom: map.getZoom() || 0,
      heading: map.getHeading() || 0,
      tilt: map.getTilt() || 0
    };

    this.scheduleUpdate();
  };

  /**
   * Retrieve the parameters to be passed to dynamic attribute callbacks.
   * @internal
   */
  getDynamicAttributeState(): {
    data: TUserData | null;
    map: MapState;
    marker: MarkerState;
  } {
    assertNotNull(this.mapState_, 'this.mapState_ is not defined');

    return {
      data: this.data_,
      map: this.mapState_,
      marker: this.markerState_
    };
  }

  static {
    // set up all attributes for the prototypes of Marker and
    // ComputedMarkerAttributes. For performance reasons, these are defined on
    // the prototype instead of the object itself.
    for (const key of attributeKeys) {
      // internal Marker-properties for all attributes, note that `this` is
      // bound to the marker-instance in the get/set callbacks.
      Object.defineProperty(Marker.prototype, key, {
        get(this: Marker) {
          return this.getAttribute_(key);
        },
        set(this: Marker, value) {
          this.setAttribute_(key, value);
        }
      });
    }
  }
}

/** @internal */
class ComputedMarkerAttributes<TUserData extends object = TUserDataDefault>
  implements Partial<StaticAttributes>
{
  private marker_: Marker<TUserData>;
  private callbackDepth_: number = 0;

  // attributes are only declared here, they are dynamically added to the
  // prototype below the class-declaration
  declare position?: StaticAttributes['position'];
  declare draggable?: StaticAttributes['draggable'];
  declare collisionBehavior?: StaticAttributes['collisionBehavior'];
  declare title?: StaticAttributes['title'];
  declare zIndex?: StaticAttributes['zIndex'];

  declare glyph?: StaticAttributes['glyph'];
  declare scale?: StaticAttributes['scale'];
  declare color?: StaticAttributes['color'];
  declare backgroundColor?: StaticAttributes['backgroundColor'];
  declare borderColor?: StaticAttributes['borderColor'];
  declare glyphColor?: StaticAttributes['glyphColor'];
  declare icon?: StaticAttributes['icon'];

  constructor(marker: Marker<TUserData>) {
    this.marker_ = marker;
  }

  static {
    for (const key of attributeKeys) {
      // set up internal properties of the ComputedMarkerAttributes class,
      // resolve all dynamic to static values.
      Object.defineProperty(ComputedMarkerAttributes.prototype, key, {
        get(this: ComputedMarkerAttributes) {
          const {map, data, marker} = this.marker_.getDynamicAttributeState();
          const callback = this.marker_.dynamicAttributes_[key];

          if (!callback) {
            return this.marker_.attributes_[key];
          } else {
            this.callbackDepth_++;

            if (this.callbackDepth_ > 10) {
              throw new Error(
                'maximum recurcion depth reached. ' +
                  'This is probably caused by a cyclic dependency in dynamic attributes.'
              );
            }

            const res = callback({
              data,
              map,
              marker,
              // forced cast to StaticAttributes; this object will behave
              // exactly like the plain attributes object as far as the callbacks
              // are concerned
              attr: this as never as StaticAttributes
            });
            this.callbackDepth_--;

            return res;
          }
        }
      });
    }
  }
}

// copied from Google Maps typings since we can't use the maps-api
// constants before the api has loaded.
export enum CollisionBehavior {
  /**
   * Display the marker only if it does not overlap with other markers. If two
   * markers of this type would overlap, the one with the higher zIndex is
   * shown. If they have the same zIndex, the one with the lower vertical
   * screen position is shown.
   */
  OPTIONAL_AND_HIDES_LOWER_PRIORITY = 'OPTIONAL_AND_HIDES_LOWER_PRIORITY',
  /**
   * Always display the marker regardless of collision. This is the default
   * behavior.
   */
  REQUIRED = 'REQUIRED',
  /**
   * Always display the marker regardless of collision, and hide any
   * OPTIONAL_AND_HIDES_LOWER_PRIORITY markers or labels that would overlap
   * with the marker.
   */
  REQUIRED_AND_HIDES_OPTIONAL = 'REQUIRED_AND_HIDES_OPTIONAL'
}

export interface StaticAttributes {
  position: google.maps.LatLngLiteral;
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
}

// just the keys for all attributes
export type AttributeKey = keyof StaticAttributes;

// dynamic attribute values are functions that take user-data and built-in
// state and return the attribute value. They are evaluated whenever the
// map- or interaction-state changes or user-data are updated.
export type DynamicAttributeValue<TUserData, TAttr> = (
  state: {data: TUserData | null} & {
    map: MapState;
    marker: MarkerState;
    attr: Partial<StaticAttributes>;
  }
) => TAttr;

// attributes can have either a static or a dynamic value
export type AttributeValue<TUserData, T> =
  | T
  | DynamicAttributeValue<TUserData, T>;

// we store two sets of attributes in the marker, static values seperated from
// dynamic values.
export type DynamicAttributes<TUserData> = {
  [key in AttributeKey]: DynamicAttributeValue<
    TUserData,
    StaticAttributes[key]
  >;
};

// These are the attribute-types as specified to the constructor and
// individual attribute setters
export type Attributes<TUserData> = {
  [key in AttributeKey]: AttributeValue<TUserData, StaticAttributes[key]>;
};

// in addition to the attributes, the map can be specified in the marker-options
export type MarkerOptions<TUserData> = {
  map?: google.maps.Map | null;
} & Partial<Attributes<TUserData>>;

// the current viewport state of the map is stored using this type and made
// accessible in the dynamic attribute callbacks.
export type MapState = {
  zoom: number;
  heading: number;
  tilt: number;
  center: google.maps.LatLng;
  bounds: google.maps.LatLngBounds;
};

// FIXME: WIP: the  marker-state will contain information about the marker
//   and it's interaction state.
export type MarkerState = {
  visible: boolean;
};
