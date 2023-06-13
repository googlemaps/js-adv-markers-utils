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
  initialize as initializeBaseMocks,
  mockInstances as baseMockInstances,
  AdvancedMarkerElement as BaseAdvancedMarkerElement,
  PinElement as BasePinElement
} from '@googlemaps/jest-mocks';

/* eslint-disable
    @typescript-eslint/no-unused-vars,
    @typescript-eslint/no-explicit-any,
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/ban-types */

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

// the mocked AdvancedMarkerElement incorrectly doesn't initialize the element
// property, which is guaranteed to be a html-element by the real API.
export class AdvancedMarkerElement extends BaseAdvancedMarkerElement {
  constructor(options: google.maps.marker.AdvancedMarkerElementOptions) {
    super(options);

    this.element = document.createElement('div');
  }
}
// custom-elements can't be extended by a regular class, so it has to
// be registered
customElements.define('test-marker-element', AdvancedMarkerElement);

export class PinElement extends BasePinElement {}

export function initialize() {
  initializeBaseMocks();
  clearAll();

  // override with a working version
  global.google.maps.LatLng = LatLng;

  global.google.maps.marker = {
    AdvancedMarkerElement,
    PinElement: PinElement as any,
    AdvancedMarkerClickEvent: google.maps.marker.AdvancedMarkerClickEvent
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

export const mockInstances = {
  get
};
