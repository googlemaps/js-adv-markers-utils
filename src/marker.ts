import {
  brighten,
  darken,
  luminance,
  parseCssColorValue,
  rgbaToString
} from './color';
import {assertMapsApiLoaded, assertNotNull, warnOnce} from './util';
import {MapStateObserver} from './map-state-observer';
import {ComputedMarkerAttributes} from './computed-marker-attributes';
import {attributeKeys} from './marker-attributes';

import type {IconProvider} from './icons';
import type {Attributes} from './marker-attributes';
import type {MapState} from './map-state-observer';

/**
 * The Marker class. The optional type-parameter T can be used to specify a type
 * to be used for the data specified in setData and available in the dynamic
 * attribute callbacks.
 */
export class Marker<TUserData = unknown> {
  private static iconProviders: Map<string, IconProvider> = new Map();

  /**
   * Registers a new icon-provider that resolves the value of the icon-attribute
   * to something that can be used as glyph. When multiple providers are used,
   * you can additionally provide a namespace for the icons.
   *
   * For example:
   *
   *     marker.icon = 'star'; // requests the 'star' icon from the 'default' provider
   *     marker.icon = 'other:star'; // requests the icon from the 'other' provider
   *
   * @param provider
   * @param namespace
   */
  static registerIconProvider(
    provider: IconProvider,
    namespace: string = 'default'
  ) {
    Marker.iconProviders.set(namespace, provider);
  }

  // attributes are declaration-only, they are dynamically added to the
  // prototype in the static-initializer
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

  declare content?: Attributes<TUserData>['content'];
  declare classList?: Attributes<TUserData>['classList'];

  private map_: google.maps.Map | null = null;
  private mapObserver_: MapStateObserver | null = null;
  private mapEventListeners_: google.maps.MapsEventListener[] = [];

  private data_: TUserData | null = null;
  private markerState_: MarkerState = {hovered: false, content: null};

  /** Attributes set by the user. */
  private attributes_: Partial<Attributes<TUserData>> = {};

  /**
   * Attributes set by inheriting classes. These are applied at a lower
   * precedence than the values in attributes_ and allow inheriting classes to
   * provide values that can be overridden by the user and restored to their
   * original value.
   */
  protected attributeDefaults_: Partial<Attributes<TUserData>> = {};

  /**
   * Computed attributes take care of resolving the dynamic attributes into the
   * static values at the time of evaluation.
   */
  private readonly computedAttributes_: ComputedMarkerAttributes<TUserData> =
    new ComputedMarkerAttributes(this);

  // AdvancedMarkerView and PinView instances used to render the marker
  private markerView_: google.maps.marker.AdvancedMarkerView;
  private pinView_: google.maps.marker.PinView;

  /**
   * Internal flag to prevent multiple updates in the same execution frame
   * (updates start as microtasks after being requested)
   */
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
   * @param eventName 'click', 'dragstart', 'dragend', 'drag' or any DOM
   *   event-name.
   * @param handler
   */
  addListener<K extends keyof GoogleMapsAMVEventMap>(
    eventName: K,
    handler: (ev: GoogleMapsAMVEventMap[K]) => void
  ): google.maps.MapsEventListener;
  addListener<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (ev: HTMLElementEventMap[K]) => void
  ): google.maps.MapsEventListener;

  addListener(
    eventName: string,
    handler: ((ev: google.maps.MapMouseEvent) => void) | ((ev: Event) => void)
  ): google.maps.MapsEventListener {
    if (eventName in MarkerEvents) {
      return this.markerView_.addListener(eventName, handler);
    }

    const element = this.markerView_.element;

    assertNotNull(element);

    element.addEventListener(
      eventName as keyof ElementEventMap,
      handler as (ev: Event) => void
    );

    return {
      remove() {
        element.removeEventListener(
          eventName as keyof ElementEventMap,
          handler as (ev: Event) => void
        );
      }
    };
  }

  /**
   * Stores the map-instance. The map will be passed on to the
   * AdvancedMarkerView in `performUpdate()`.
   */
  get map(): google.maps.Map | null {
    return this.map_ || null;
  }

  set map(map: google.maps.Map | null) {
    if (this.map_ === map) {
      return;
    }

    this.unbindEvents_();
    this.mapObserver_ = null;
    this.map_ = map;

    if (map) {
      this.mapObserver_ = MapStateObserver.getInstance(map);
      this.bindEvents_();
    }

    this.update();
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
    Object.assign(this.attributes_, attributes);
    this.update();
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
    if (!this.map) {
      this.markerView_.map = null;

      return;
    }

    const attrs = this.computedAttributes_ as ComputedMarkerAttributes;
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

    this.markerView_.position = position;
    this.markerView_.draggable = attrs.draggable;
    this.markerView_.title = attrs.title;
    this.markerView_.zIndex = attrs.zIndex;
    this.markerView_.collisionBehavior = attrs.collisionBehavior;
    this.pinView_.scale = attrs.scale;

    this.updateContent_(attrs);

    // the element is stored in markerState to allow for dom updates
    // in dynamic attributes instead of creating new elements all
    // the time.
    this.markerState_.content = attrs.content || null;
  }

  /**
   * Updates the content element, it's classes and css custom properties.
   *
   * @param attrs
   */
  private updateContent_(attrs: ComputedMarkerAttributes) {
    const {content, classList} = attrs;

    if (content) {
      content.className = classList ? classList.join(' ') : '';
      this.markerView_.content = content;
    } else {
      this.markerView_.content = this.pinView_.element;
      this.updateColors_(attrs);
      this.updateGlyph_(attrs);
    }

    if (this.markerView_.element) {
      const el = this.markerView_.element as HTMLElement;
      const {
        color = null,
        backgroundColor = null,
        glyphColor = null,
        borderColor = null,
        scale = null
      } = attrs;

      el.style.setProperty('--marker-color', color);
      el.style.setProperty('--marker-background-color', backgroundColor);
      el.style.setProperty('--marker-glyph-color', glyphColor);
      el.style.setProperty('--marker-border-color', borderColor);
      el.style.setProperty('--marker-scale', scale ? scale.toString() : null);
    }
  }

  /**
   * Updates the colors for the embedded pin-view based on the different color
   * attributes.
   *
   * @param attributes
   */
  private updateColors_(attributes: ComputedMarkerAttributes) {
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

  /**
   * Updates the pinview glyph based on the `icon` and `glyph` attributes.
   *
   * @param attrs
   */
  private updateGlyph_(attrs: ComputedMarkerAttributes) {
    if (!attrs.icon) {
      this.pinView_.glyph = attrs.glyph || undefined;

      return;
    }

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
  }

  /** Binds the required dom- and map-events to the marker-instance. */
  private bindEvents_() {
    assertNotNull(this.mapObserver_);

    this.mapEventListeners_ = [
      this.mapObserver_.addListener(() => this.update()),
      this.addListener('pointerenter', () => {
        this.markerState_.hovered = true;
        this.update();
      }),
      this.addListener('pointerleave', () => {
        this.markerState_.hovered = false;
        this.update();
      })
    ];
  }

  /** Unbinds all event listeners from the marker. */
  private unbindEvents_() {
    for (const listener of this.mapEventListeners_) listener.remove();
    this.mapEventListeners_ = [];
  }

  /**
   * Retrieve the parameters to be passed to dynamic attribute callbacks. This
   * method is part of the internal API used by the ComputedMarkerAttributes.
   *
   * @internal
   */
  getDynamicAttributeState(): {
    data: TUserData | null;
    map: MapState;
    marker: MarkerState;
  } {
    assertNotNull(this.mapObserver_, 'this.mapObserver_ is not defined');

    return {
      data: this.data_,
      map: this.mapObserver_.getMapState(),
      marker: this.markerState_
    };
  }

  static {
    // set up all attributes for the prototypes of Marker and
    // ComputedMarkerAttributes. For performance reasons, these are defined on
    // the prototype instead of the object itself.
    for (const key of attributeKeys) {
      // Note: in a static initializer, `this` refers to the class itself.
      Object.defineProperty(this.prototype, key, {
        get(this: Marker) {
          return this.attributes_[key] || this.attributeDefaults_[key];
        },

        set(this: Marker, value) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.attributes_[key] = value;
          this.update();
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
  content: HTMLElement | null;
};

enum MarkerEvents {
  click = 'click',
  dragstart = 'dragstart',
  drag = 'drag',
  dragend = 'dragend'
}

interface GoogleMapsAMVEventMap {
  click: google.maps.MapMouseEvent;
  dragstart: google.maps.MapMouseEvent;
  drag: google.maps.MapMouseEvent;
  dragend: google.maps.MapMouseEvent;
}
