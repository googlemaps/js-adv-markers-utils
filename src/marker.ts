/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
 * The Marker class.
 *
 * @typeParam TUserData - Can be used to specify a type for the data specified
 *   in {@link Marker.setData} and available in dynamic attribute callbacks.
 */
export class Marker<TUserData = unknown> {
  private static iconProviders: Map<string, IconProvider> = new Map();

  /**
   * Registers a new icon provider that resolves the value of the icon-attribute
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

  /** The position of the marker on the map. */
  declare position?: Attributes<TUserData>['position'];

  /**
   * Flag to enable draggable markers. When using draggable markers, the
   * position-attribute of the marker will not be automatically updated. You
   * have to listen to the `dragstart`, `drag` and `dragend` events and update
   * the position accordingly.
   */
  declare draggable?: Attributes<TUserData>['draggable'];

  /**
   * The collision behavior controls how the marker interacts with other markers
   * and labels on the map. See {@link CollisionBehavior} for more information.
   */
  declare collisionBehavior?: Attributes<TUserData>['collisionBehavior'];

  /**
   * The title of the marker element. Will be shown in the browsers default
   * tooltip and should be provided for accessibility reasons.
   */
  declare title?: Attributes<TUserData>['title'];

  /**
   * Defines the z-ordering for the marker and is used to compute the priority
   * for collision handling. See [the official documentation][gmp-marker-zindex]
   * for more information.
   *
   * [gmp-marker-zindex]: https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerElementOptions.zIndex
   */
  declare zIndex?: Attributes<TUserData>['zIndex'];

  /**
   * The glyph to be shown inside the marker-pin. This can be a single letter or
   * number, a dom-element or a URL-object pointing to an image file.
   */
  declare glyph?: Attributes<TUserData>['glyph'];

  /** The scale of the marker as a multiple of the original scale. */
  declare scale?: Attributes<TUserData>['scale'];

  /**
   * The color of the marker. Can be specified in any format supported by CSS.
   *
   * This is a shorthand property to set a default value for the three
   * color-values (`backgroundColor`, `borderColor` and `glyphColor`) to
   * matching colors.
   *
   * The `backgroundColor` will be set to the specified color, the border-color
   * will be a darkened vertsion of the color and the glyph-color is set based
   * on the brightness of the specified color to either a darkened or lightened
   * version.
   */
  declare color?: Attributes<TUserData>['color'];

  /**
   * The background-color for the marker pin. Can be specified in any format
   * supported by CSS.
   */
  declare backgroundColor?: Attributes<TUserData>['backgroundColor'];

  /**
   * The border-color for the marker pin. Can be specified in any format
   * supported by CSS.
   */
  declare borderColor?: Attributes<TUserData>['borderColor'];

  /**
   * The color of the glyph within the marker pin. Can be specified in any
   * format supported by CSS.
   */
  declare glyphColor?: Attributes<TUserData>['glyphColor'];

  /**
   * The id of an icon to be fetched via the {@link icons.IconProvider}. The
   * resulting icon will be shown
   */
  declare icon?: Attributes<TUserData>['icon'];

  /**
   * The content to replace the default pin. The specified html-element will be
   * rendered instead of the default pin.
   *
   * The content element you provide here will have access to the
   * style-properties of the marker (colors and scale) via css custom properties
   * (e.g. `color: var(--marker-glyph-color, white)`).
   */
  declare content?: Attributes<TUserData>['content'];

  /**
   * A single classname or list of class names to be added to the content
   * element.
   */
  declare classList?: Attributes<TUserData>['classList'];

  /** The map instance the marker is added to. */
  private map_: google.maps.Map | null = null;

  /**
   * The map-observer receives the `bounds_changed` event from the map-instances
   * and provides the map-data for the dynamic attributes.
   */
  private mapObserver_: MapStateObserver | null = null;

  /**
   * All listeners bound to the marker, it's dom-element or the map-instance are
   * stored here, so they can be easily removed when the marker is removed from
   * the map.
   *
   * @see Marker.bindEvents_()
   * @see Marker.unbindEvents_()
   */
  private mapEventListeners_: google.maps.MapsEventListener[] = [];

  /**
   * User-data that has been passed to the constructor or the
   * {@link Marker.setData} method.
   */
  private data_: TUserData | null = null;

  /**
   * Special state attributes of the marker that are made available in dynamic
   * attribute callbacks.
   */
  private markerState_: MarkerState = {
    hovered: false,
    content: document.createElement('div')
  };

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

  // AdvancedMarkerElement and PinElement instances used to render the marker
  private markerView_: google.maps.marker.AdvancedMarkerElement;
  private pinView_: google.maps.marker.PinElement;

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

    this.pinView_ = new google.maps.marker.PinElement();
    this.markerView_ = new google.maps.marker.AdvancedMarkerElement();
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
   * AdvancedMarkerElement in `performUpdate()`.
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
   * Schedules an update of the marker, writing all attribute values to the
   * underlying advanced marker objects. Calling this manually should not be
   * needed.
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
   * AdvancedMarkerElement and PinElement. This method is called very often, so it is
   * critical to keep it as performant as possible:
   *
   * - Avoid object allocations if possible
   * - Avoid expensive computations. These can likely be moved into setAttribute_
   *   or the ComputedMarkerAttributes class
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
    this.markerView_.gmpDraggable = attrs.draggable || false;
    this.markerView_.title = attrs.title || '';
    this.markerView_.zIndex = attrs.zIndex;
    this.markerView_.collisionBehavior = attrs.collisionBehavior;
    this.pinView_.scale = attrs.scale;

    this.updateContent_(attrs);

    // the element returned by a dynamic content attribute is stored in the
    // markerState to allow for dom updates in dynamic attributes instead of
    // creating new elements for every update.
    if (attrs.content) this.markerState_.content = attrs.content;
  }

  /**
   * Updates the content element, it's classes and css custom properties.
   *
   * @param attrs
   */
  private updateContent_(attrs: ComputedMarkerAttributes) {
    const {content, classList} = attrs;

    if (content) {
      content.className = classList
        ? Array.isArray(classList)
          ? classList.join(' ')
          : classList
        : '';
      this.markerView_.content = content;
    } else {
      this.markerView_.content = this.pinView_.element;
      this.updateColors_(attrs);
      this.updateGlyph_(attrs);
    }

    if (this.markerView_.element) {
      const el = this.markerView_.element;
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
   * Updates the pinelement glyph based on the `icon` and `glyph` attributes.
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
    // set up all attributes for the Marker prototype. For performance reasons,
    // these are defined on the prototype instead of the object itself.
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
 *
 * @typeParam TUserData - The type of the user-specified data passed to
 *   `setData()` and made available in the arguments of the dynamic attribute
 *   callbacks.
 */
export type MarkerOptions<TUserData> = {
  map?: google.maps.Map | null;
} & Partial<Attributes<TUserData>>;

/**
 * The MarkerState contains additional state-information about the marker
 * itself.
 */
export type MarkerState = {
  hovered: boolean;
  content: HTMLElement;
};

/**
 * The names of events that will be forwarded to the Google Maps implementation
 * instead of using standard dom-events.
 */
enum MarkerEvents {
  click = 'click',
  dragstart = 'dragstart',
  drag = 'drag',
  dragend = 'dragend'
}

/**
 * Maps the supported Google Maps events to the type of event-object the
 * callbacks will receive.
 */
interface GoogleMapsAMVEventMap {
  click: google.maps.MapMouseEvent;
  dragstart: google.maps.MapMouseEvent;
  drag: google.maps.MapMouseEvent;
  dragend: google.maps.MapMouseEvent;
}
