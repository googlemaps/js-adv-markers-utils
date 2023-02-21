import {
  initialize as initializeBaseMocks,
  mockInstances as baseMockInstances
} from '@googlemaps/jest-mocks';

/*
 * This file only exists to avoid having to deal with getting support for the
 * markers library into the @googlemaps/jest-mocks repo first.
 */

/* eslint-disable
    @typescript-eslint/no-unused-vars,
    @typescript-eslint/no-explicit-any,
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/ban-types */

export const MapsEventListener: google.maps.MapsEventListener = {
  remove: jest.fn()
};

export class AdvancedMarkerView
  implements google.maps.marker.AdvancedMarkerViewOptions
{
  public addListener = jest
    .fn()
    .mockImplementation(
      (
        eventName: string,
        handler: (this: AdvancedMarkerView, event: MouseEvent) => void
      ): google.maps.MapsEventListener => MapsEventListener
    );

  element?: Element | null = document.createElement('div');
  map?: google.maps.Map | null;
  content?: Element | null;
  collisionBehavior?: google.maps.CollisionBehavior | null;
  zIndex?: number | null;
  title?: string | null;
  draggable?: boolean | null;

  position?:
    | google.maps.LatLng
    | google.maps.LatLngLiteral
    | google.maps.LatLngAltitudeLiteral
    | null;

  constructor(options?: google.maps.marker.AdvancedMarkerViewOptions) {
    __registerMockInstance(AdvancedMarkerView, this);
  }
}

export class PinView implements google.maps.marker.PinViewOptions {
  public addListener = jest
    .fn()
    .mockImplementation(
      (
        eventName: string,
        handler: (this: PinView, event: MouseEvent) => void
      ): google.maps.MapsEventListener => MapsEventListener
    );

  background?: string | null;
  borderColor?: string | null;
  element?: null | Element = document.createElement('div');
  glyph?: string | null | Element | URL;
  glyphColor?: string | null;
  scale?: number | null;

  constructor(options?: google.maps.marker.PinViewOptions) {
    __registerMockInstance(PinView, this);
  }
}

class LatLng implements google.maps.LatLng {
  private readonly lat_: number = 0;
  private readonly lng_: number = 0;

  constructor(ll: LatLng, noClampNoWrap?: boolean);
  constructor(ll: google.maps.LatLngLiteral, noClampNoWrap?: boolean);
  constructor(lat: number, lng: number, noClampNoWrap?: boolean);
  constructor(
    latOrLatLngOrLatLngLiteral: LatLng | google.maps.LatLngLiteral | number,
    lngOrNoClampNoWrap?: number | boolean,
    noClampNoWrap?: boolean
  ) {
    if (latOrLatLngOrLatLngLiteral instanceof LatLng) {
      this.lat_ = latOrLatLngOrLatLngLiteral.lat();
      this.lng_ = latOrLatLngOrLatLngLiteral.lng();
    } else if (typeof latOrLatLngOrLatLngLiteral !== 'number') {
      this.lat_ = latOrLatLngOrLatLngLiteral.lat;
      this.lng_ = latOrLatLngOrLatLngLiteral.lng;
    } else {
      this.lat_ = latOrLatLngOrLatLngLiteral;
      this.lng_ = lngOrNoClampNoWrap as number;
    }
  }

  equals(other: google.maps.LatLng | null): boolean {
    if (!other) return false;
    return this.lat() === other.lat() && this.lng() === other.lng();
  }

  lat(): number {
    return this.lat_;
  }

  lng(): number {
    return this.lng_;
  }

  toJSON(): google.maps.LatLngLiteral {
    return {lat: this.lat(), lng: this.lng()};
  }

  toUrlValue(precision: number = 6): string {
    return `${this.lat().toFixed(precision)},${this.lng().toFixed(precision)}`;
  }
}

export function initialize() {
  initializeBaseMocks();
  clearAll();

  // override with a working version
  global.google.maps.LatLng = LatLng;

  global.google.maps.marker = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    AdvancedMarkerView,
    PinView
  };
}

export const REGISTRY = new Map<string, any[]>();

type Constructable = {new (...args: any[]): unknown};

function get<T extends Constructable>(item: T): InstanceType<T>[] {
  return [
    ...baseMockInstances.get(item),
    ...((REGISTRY.get(item.name) || []) as InstanceType<T>[])
  ];
}

function clearAll(): void {
  baseMockInstances.clearAll();
  REGISTRY.clear();
}

// Signature to require at least one item
function clear<T extends Constructable, K extends Constructable[]>(
  item: T,
  ...rest: K
): void {
  baseMockInstances.clear(item, ...rest);
  for (const ctr of [item, ...rest]) {
    REGISTRY.delete(ctr.name);
  }
}

export const mockInstances = {
  get,
  clear,
  clearAll
};

function __registerMockInstance(ctr: Function, instance: any): void {
  const existing = REGISTRY.get(ctr.name) || [];
  REGISTRY.set(ctr.name, [...existing, instance]);
}
