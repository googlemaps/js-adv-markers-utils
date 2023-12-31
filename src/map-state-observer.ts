/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/** The MapState type describes the current viewport state of the map. */
export type MapState = {
  zoom: number;
  heading: number;
  tilt: number;
  center: google.maps.LatLng;
  bounds: google.maps.LatLngBounds;
};

export type MapStateListener = (state: MapState) => void;

/**
 * Since we have many more markers than maps, it doesn't make sense to have each
 * marker observe the map for changes by itself. Instead, a MapStateObserver is
 * created for every map that receives 'bounds_changed'-events from the map and
 * triggers updates for all added markers.
 */
export class MapStateObserver {
  private static instances_ = new Map<google.maps.Map, MapStateObserver>();

  /**
   * Returns the observer instance for the given map.
   *
   * @param map
   */
  static getInstance(map: google.maps.Map): MapStateObserver {
    if (!this.instances_.has(map)) {
      this.instances_.set(map, new MapStateObserver(map));
    }

    return this.instances_.get(map) as MapStateObserver;
  }

  private map_: google.maps.Map;
  private mapState_!: MapState;
  private listeners_: MapStateListener[] = [];

  private constructor(map: google.maps.Map) {
    this.map_ = map;

    map.addListener('bounds_changed', () => this.handleBoundsChange());
    this.handleBoundsChange();
  }

  /**
   * Add a listener to be notified of map-state changes.
   *
   * @param callback
   */
  addListener(callback: MapStateListener): google.maps.MapsEventListener {
    this.listeners_.push(callback);

    return {
      remove: () => {
        this.listeners_.splice(this.listeners_.indexOf(callback), 1);
      }
    };
  }

  /**
   * Returns the map-state as it will be passed into the dynamic attribute
   * callbacks of the markers.
   */
  getMapState(): MapState {
    return this.mapState_;
  }

  private handleBoundsChange() {
    const center = this.map_.getCenter();
    const bounds = this.map_.getBounds();

    if (!center || !bounds) {
      console.debug(
        'MapStateObserver.handleBoundsChange(): map center and/or bounds ' +
          'undefined. Not updating map state.'
      );

      return;
    }

    this.mapState_ = {
      center,
      bounds,
      zoom: this.map_.getZoom() || 0,
      heading: this.map_.getHeading() || 0,
      tilt: this.map_.getTilt() || 0
    };

    for (const listener of this.listeners_) {
      listener(this.mapState_);
    }
  }
}
