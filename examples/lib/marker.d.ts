/// <reference types="google.maps" />
import type { IconProvider } from './icons';
/**
 * The Marker class.
 * The optional type-parameter TUserData can be used to specify a type to
 * be used for the data specified in setData and available in the dynamic
 * attribute callbacks.
 */
export declare class Marker<TUserData = unknown> {
    private static iconProviders;
    static registerIconProvider(provider: IconProvider, namespace?: string): void;
    position?: Attributes<TUserData>['position'];
    draggable?: Attributes<TUserData>['draggable'];
    collisionBehavior?: Attributes<TUserData>['collisionBehavior'];
    title?: Attributes<TUserData>['title'];
    zIndex?: Attributes<TUserData>['zIndex'];
    glyph?: Attributes<TUserData>['glyph'];
    scale?: Attributes<TUserData>['scale'];
    color?: Attributes<TUserData>['color'];
    backgroundColor?: Attributes<TUserData>['backgroundColor'];
    borderColor?: Attributes<TUserData>['borderColor'];
    glyphColor?: Attributes<TUserData>['glyphColor'];
    icon?: Attributes<TUserData>['icon'];
    private data_?;
    private markerState_;
    private mapState_;
    readonly attributes_: Partial<StaticAttributes>;
    readonly dynamicAttributes_: Partial<DynamicAttributes<TUserData>>;
    readonly computedAttributes_: ComputedMarkerAttributes<TUserData>;
    private mapEventListener_;
    private markerView_;
    private pinView_;
    private updateScheduled_;
    /**
     * Creates a new marker instance.
     * Markers can be created without any options, or with any number of
     * attributes set.
     *
     * @param options
     * @param data
     */
    constructor(options?: MarkerOptions<TUserData>, data?: TUserData);
    /**
     * Adds an event-listener to this marker. The internal events (click and
     * dragging events) are attached to the marker instance using the Google Maps
     * event system, while any dom-events will be added to the marker-element
     * itself.
     *
     * FIXME: normalize event-handler-parameters
     * FIXME: extend the typings to be explicit about the callback-parameters
     *
     * @param eventName 'click', 'dragstart', 'dragend', 'drag' or any DOM event-name.
     * @param handler
     */
    addListener(eventName: string, handler: (ev: google.maps.MapMouseEvent | Event) => void): google.maps.MapsEventListener;
    /**
     * The map property is a proxy for this.markerView_.map, setting the map
     * will also retrieve the view-state from the map and update the marker.
     */
    get map(): google.maps.Map | null;
    set map(map: google.maps.Map | null);
    /**
     * Sets the data for this marker and triggers an update.
     * @param data
     */
    setData(data: TUserData): void;
    /**
     * Updates the colors for the embedded pin-view based on the different
     * color attributes.
     * @param attributes
     */
    private updateColors;
    enableEvents(): void;
    disableEvents(): void;
    /**
     * Binds the required dom-events to the marker-instance.
     */
    private bindMarkerEvents;
    /**
     * Handles the bounds_changed event for the map to update our internal state.
     * @param map
     */
    private onMapBoundsChange;
}
export declare enum CollisionBehavior {
    /**
     * Display the marker only if it does not overlap with other markers. If two
     * markers of this type would overlap, the one with the higher zIndex is
     * shown. If they have the same zIndex, the one with the lower vertical
     * screen position is shown.
     */
    OPTIONAL_AND_HIDES_LOWER_PRIORITY = "OPTIONAL_AND_HIDES_LOWER_PRIORITY",
    /**
     * Always display the marker regardless of collision. This is the default
     * behavior.
     */
    REQUIRED = "REQUIRED",
    /**
     * Always display the marker regardless of collision, and hide any
     * OPTIONAL_AND_HIDES_LOWER_PRIORITY markers or labels that would overlap
     * with the marker.
     */
    REQUIRED_AND_HIDES_OPTIONAL = "REQUIRED_AND_HIDES_OPTIONAL"
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
export type AttributeKey = keyof StaticAttributes;
export type DynamicAttributeValue<TUserData, TAttr> = (state: {
    data: TUserData;
} & {
    map: MapState;
    marker: MarkerState;
    attr: Partial<StaticAttributes>;
}) => TAttr;
export type AttributeValue<TUserData, T> = T | DynamicAttributeValue<TUserData, T>;
export type DynamicAttributes<TUserData> = {
    [key in AttributeKey]: DynamicAttributeValue<TUserData, StaticAttributes[key]>;
};
export type Attributes<TUserData> = {
    [key in AttributeKey]: AttributeValue<TUserData, StaticAttributes[key]>;
};
export type MarkerOptions<TUserData> = {
    map?: google.maps.Map | null;
} & Partial<Attributes<TUserData>>;
export type MapState = {
    zoom: number;
    heading: number;
    tilt: number;
    center: google.maps.LatLng;
    bounds: google.maps.LatLngBounds;
};
export type MarkerState = {
    hovered: boolean;
    visible: boolean;
};
