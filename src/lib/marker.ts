import {
  darken,
  brighten,
  luminance,
  parseCssColorValue,
  rgbaToString
} from './color';
import {assertMapsApiLoaded, assertNotNull, warnOnce} from './util';

import type {IconProvider} from './icons';
import type {MapState} from './map-state-observer';
import {MapStateObserver} from './map-state-observer';

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
 * The Marker class. The optional type-parameter T can be used to specify a type
 * to be used for the data specified in setData and available in the dynamic
 * attribute callbacks.
 */
export class Marker<TUserData = unknown> {
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

  private map_: google.maps.Map | null = null;
  private mapObserver_: MapStateObserver | null = null;
  private mapEventListener_: google.maps.MapsEventListener | null = null;

  // since updates can be triggered in multiple ways, we store the last
  // known state of the three contributing sources
  private data_?: TUserData;
  private markerState_: MarkerState = {visible: false, hovered: false};

  // attributes set by the user are stored in attributes_ and
  // dynamicAttributes_.
  readonly attributes_: Partial<StaticAttributes> = {};
  readonly dynamicAttributes_: Partial<DynamicAttributes<TUserData>> = {};
  readonly computedAttributes_ = new ComputedMarkerAttributes(this);

  // AdvancedMarkerView and PinView instances used to render the marker
  private markerView_: google.maps.marker.AdvancedMarkerView;
  private pinView_: google.maps.marker.PinView;

  // internal flag to prevent multiple updates in the same execution frame
  // (updates start as microtasks after being requested)
  private updateScheduled_: boolean = false;

  /**
   * Creates a new marker instance. Markers can be created without any options,
   * or with any number of attributes set.
   *
   * @param options
   * @param data
   */
  constructor(options: MarkerOptions<TUserData> = {}, data?: TUserData) {
    const {map, ...attributes} = options;

    assertMapsApiLoaded();

    this.pinView_ = new google.maps.marker.PinView();
    this.markerView_ = new google.maps.marker.AdvancedMarkerView();
    this.markerView_.content = this.pinView_.element;

    this.bindMarkerEvents();

    if (data) this.data_ = data;

    // set all remaining parameters as attributes
    this.setAttributes(attributes);

    if (map) {
      this.map = map;
      this.update();
    }
  }

  /**
   * Adds an event-listener to this marker. The internal events (click and
   * dragging events) are attached to the marker instance using the Google Maps
   * event system, while any dom-events will be added to the marker-element
   * itself.
   *
   * FIXME: normalize event-handler-parameters FIXME: extend the typings to be
   * explicit about the callback-parameters
   *
   * @param eventName 'click', 'dragstart', 'dragend', 'drag' or any DOM
   *   event-name.
   * @param handler
   */
  addListener(
    eventName: string,
    handler: (ev: google.maps.MapMouseEvent | Event) => void
  ): google.maps.MapsEventListener {
    if (eventName in MarkerEvents) {
      return this.markerView_.addListener(eventName, handler);
    }

    const element = this.markerView_.element;

    assertNotNull(element);

    element.addEventListener(eventName as keyof ElementEventMap, handler);

    return {
      remove() {
        element.removeEventListener(
          eventName as keyof ElementEventMap,
          handler
        );
      }
    };
  }

  /**
   * The map property is a proxy for this.map_, setting the map will also start
   * listening for map-state events and update the marker.
   */
  get map(): google.maps.Map | null {
    return this.map_ || null;
  }

  set map(map: google.maps.Map | null) {
    if (this.map_ === map) {
      return;
    }

    if (this.mapEventListener_) {
      this.mapEventListener_.remove();
      this.mapEventListener_ = null;
      this.mapObserver_ = null;
    }

    this.map_ = map;

    if (map) {
      this.mapObserver_ = MapStateObserver.getInstance(map);
      this.mapEventListener_ = this.mapObserver_.addListener(() =>
        this.update()
      );

      this.update();
    }
  }

  /**
   * Sets the data for this marker and triggers an update.
   *
   * @param data
   */
  setData(data: TUserData) {
    this.data_ = data;

    this.update();
  }

  /**
   * Sets multiple attributes at once.
   *
   * @param attributes
   */
  setAttributes(attributes: Partial<Attributes<TUserData>>) {
    // set all remaining parameters as attributes
    for (const [key, value] of Object.entries(attributes)) {
      this.setAttribute_(key as AttributeKey, value);
    }
  }

  /**
   * Internal method to set attribute values. Splits specified attributes into
   * static and dynamic attributes and triggers an update.
   *
   * @param name
   * @param value
   */
  private setAttribute_<
    TKey extends AttributeKey,
    TValue extends Attributes<TUserData>[TKey]
  >(name: TKey, value: TValue) {
    // update the marker when we're done
    this.update();

    if (typeof value === 'function') {
      this.dynamicAttributes_[name] =
        value as DynamicAttributes<TUserData>[TKey];
    } else {
      this.attributes_[name] = value as StaticAttributes[TKey];
      delete this.dynamicAttributes_[name];
    }
  }

  /**
   * Internal method to get the attribute value as it was specified by the user
   * (e.g. will return the dynamic attribute function instead of the effective
   * value).
   *
   * @param name
   */
  private getAttribute_<TKey extends AttributeKey>(
    name: TKey
  ): Attributes<TUserData>[TKey] {
    return (
      (this.dynamicAttributes_[name] as DynamicAttributes<TUserData>[TKey]) ||
      (this.attributes_[name] as StaticAttributes[TKey])
    );
  }

  /**
   * Schedules an update via microtask. This makes sure that we won't run
   * multiple updates when multiple attributes are changed sequentially.
   */
  update() {
    if (this.updateScheduled_) return;

    this.updateScheduled_ = true;
    queueMicrotask(() => {
      this.updateScheduled_ = false;
      this.performUpdate();
    });
  }

  /**
   * Updates the rendered objects for this marker, typically an
   * AdvancedMarkerView and PinView. This method is called very often, so it is
   * critical to keep it as performant as possible:
   *
   * - Avoid object allocations if possible
   * - Avoid expensive computations. These can likely be moved into setAttribute_
   *   or the ComputedMarkerAttributes class
   *
   * @internal
   */
  private performUpdate() {
    if (!this.map || !this.mapObserver_) {
      console.warn('marker update skipped: missing map');
      return;
    }

    const attrs = this.computedAttributes_;
    const position = attrs.position;

    // if the marker doesn't have a position, we can skip it entirely and
    // remove it from the map.
    if (!position) {
      this.markerView_.map = null;

      return;
    }

    if (this.markerView_.map !== this.map_) {
      this.markerView_.map = this.map_;
    }

    this.updateColors(attrs);

    // FIXME: in cases where there's an `if` here, we need to make sure that
    //   state updates might require us to reset the state (i.e. icon changes
    //   from 'some-icon' to undefined).

    // FIXME: how to handle undefined values? Should we skip those?
    //  Or have fixed defaults for everything?

    this.markerView_.position = position;
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
   * Updates the colors for the embedded pin-view based on the different color
   * attributes.
   *
   * @param attributes
   */
  private updateColors(attributes: Partial<StaticAttributes>) {
    let {color, backgroundColor, borderColor, glyphColor} = attributes;

    if (color) {
      const rgba = parseCssColorValue(color);
      const rgbaDark = darken(rgba, 1.2);
      const rgbaLight = brighten(rgba, 1.2);

      if (!backgroundColor) backgroundColor = rgbaToString(rgba);
      if (!borderColor) borderColor = rgbaToString(rgbaDark);

      if (!glyphColor) {
        glyphColor = rgbaToString(luminance(rgba) > 0.4 ? rgbaDark : rgbaLight);
      }
    }

    this.pinView_.background = backgroundColor;
    this.pinView_.borderColor = borderColor;
    this.pinView_.glyphColor = glyphColor;
  }

  /** Binds the required dom-events to the marker-instance. */
  private bindMarkerEvents = () => {
    // fixme: do we want those to be always bound?
    //   a) add/remove listeners when the marker is added to the map?
    //   b) should there be a property to control wether we have these
    //      events at all?

    this.addListener('pointerenter', () => {
      this.markerState_.hovered = true;
      this.update();
    });

    this.addListener('pointerleave', () => {
      this.markerState_.hovered = false;
      this.update();
    });
  };

  /**
   * Retrieve the parameters to be passed to dynamic attribute callbacks.
   *
   * @internal
   */
  getDynamicAttributeState(): {
    data?: TUserData;
    map: MapState;
    marker: MarkerState;
  } {
    assertNotNull(this.mapObserver_, 'this.mapObserver_ is not defined');

    const mapState = this.mapObserver_.getMapState();

    return {
      data: this.data_,
      map: mapState,
      marker: this.markerState_
    };
  }

  static {
    // set up all attributes for the prototypes of Marker and
    // ComputedMarkerAttributes. For performance reasons, these are defined on
    // the prototype instead of the object itself.
    for (const key of attributeKeys) {
      // Note: In a static initializer, `this` points to the class constructor,
      // so `this.prototype` is the same as `Marker.prototype` (which isn't
      // allowed). Within the get/set functions, this is bound to the actual
      // marker instance.
      Object.defineProperty(this.prototype, key, {
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
class ComputedMarkerAttributes<TUserData = unknown>
  implements Partial<StaticAttributes>
{
  private marker_: Marker<TUserData>;
  private callbackDepth_: number = 0;

  // attributes are only declared here, they are dynamically added to the
  // prototype in the static initializer below.
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
      Object.defineProperty(this.prototype, key, {
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

            const res = callback({data, map, marker, attr: this});
            this.callbackDepth_--;

            return res;
          }
        }
      });
    }
  }
}

/**
 * The CollisionBehaviour enum is copied from Google Maps typings in order to
 * allow those to be used before the api has loaded.
 */
export enum CollisionBehavior {
  /**
   * Display the marker only if it does not overlap with other markers. If two
   * markers of this type would overlap, the one with the higher zIndex is
   * shown. If they have the same zIndex, the one with the lower vertical screen
   * position is shown.
   */
  OPTIONAL_AND_HIDES_LOWER_PRIORITY = 'OPTIONAL_AND_HIDES_LOWER_PRIORITY',
  /**
   * Always display the marker regardless of collision. This is the default
   * behavior.
   */
  REQUIRED = 'REQUIRED',
  /**
   * Always display the marker regardless of collision, and hide any
   * OPTIONAL_AND_HIDES_LOWER_PRIORITY markers or labels that would overlap with
   * the marker.
   */
  REQUIRED_AND_HIDES_OPTIONAL = 'REQUIRED_AND_HIDES_OPTIONAL'
}

/** StaticAttributes contains the base definition for all attribute-values. */
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

/**
 * DynamicAttributeValues are functions that take a state object consisting of
 * internal state and user-data and return the attribute value. They are
 * evaluated whenever the a state-change happens or user-data is updated.
 */
export type DynamicAttributeValue<TUserData, TAttr> = (
  state: {data: TUserData} & {
    map: MapState;
    marker: MarkerState;
    attr: Partial<StaticAttributes>;
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

/**
 * The single options argument for the marker-class contains the attributes as
 * well as additional options.
 */
export type MarkerOptions<T> = {
  map?: google.maps.Map | null;
} & Partial<Attributes<T>>;

/**
 * The MarkerState contains additional state-information about the marker
 * itself.
 */
export type MarkerState = {
  hovered: boolean;
  visible: boolean;
};

enum MarkerEvents {
  click = 'click',
  dragstart = 'dragstart',
  drag = 'drag',
  dragend = 'dragend'
}
