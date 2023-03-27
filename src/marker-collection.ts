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

import {Marker, MarkerOptions} from './marker';
import {warnOnce} from './util';
import type {Attributes} from './marker-attributes';

/**
 * Markers in a collection can have additional (virtual) attributes that are
 * defined here.
 */
export type CollectionMarkerAttributes<TUserData> = Attributes<TUserData> & {
  /**
   * The key function used to create string ids for the records in the
   * collection. Specifying this function is highly recommended when the data
   * needs to be updated.
   */
  key: (data: TUserData) => string;
};

export type MarkerCollectionOptions<T> = {
  map?: google.maps.Map | null;
} & Partial<CollectionMarkerAttributes<T>>;

/**
 * The MarkerCollection provides bindings between an array of arbitrary records
 * and the corresponding markers.
 *
 * - Attributes: attributes are shared with all markers, for the
 *   position-attribute this has to be a dynamic attribute, all other attributes
 *   could be either static or dynamic attributes.
 * - Data-updates: data in the collection can be updated after creation. This will
 *   assume that complete sets of records are passed on every update. If
 *   incremental updates are needed, those have to be applied to the data before
 *   updating the marker collection. When transitions are implemented (also for
 *   performance reasons), it will become important to recognize identical
 *   records, so those can be updated instead of re-created with every update.
 *
 * @example
 *   const myData = [{position: [10, 53.5]}, {position: [-110, 23]}];
 *
 *   const markers = new MarkerCollection(myData, {
 *     position: ({data}) => data.position
 *   });
 *
 *   markers.map = map;
 */

export class MarkerCollection<TUserData extends object = object> {
  /** The map instance the markers are added to. */
  private map_: google.maps.Map | null = null;
  /** The markers, stored by their keys */
  private markers_: Map<string, Marker<TUserData>> = new Map();
  /** The shared marker-attributes. */
  private markerAttributes_: Partial<Attributes<TUserData>> = {};
  /**
   * When a key-function is missing, unique keys are automatically generated. In
   * case the same objects are passed into setData() again, the generated keys
   * can be looked up in this map.
   */
  private generatedKeyCache_ = new WeakMap<TUserData, string>();

  /**
   * The key function used to create string ids for the records in the
   * collection. Specifying this function is highly recommended when the data
   * needs to be updated.
   */
  key?: (data: TUserData) => string;

  /**
   * Creates a new MarkerCollection without specifying the data yet. This could
   * be useful since fetching the data typically happens at a different time
   * Providing data when creating the marker-collection is optional.
   *
   * @param options
   */
  constructor(options: MarkerCollectionOptions<TUserData>);

  /**
   * Creates a new MarkerCollection with existing data.
   *
   * @param data
   * @param options
   */
  constructor(data: TUserData[], options: MarkerCollectionOptions<TUserData>);

  constructor(
    dataOrOptions: TUserData[] | MarkerCollectionOptions<TUserData>,
    optOptions?: MarkerCollectionOptions<TUserData>
  ) {
    let data: TUserData[] = [];
    let options: MarkerCollectionOptions<TUserData>;

    if (arguments.length === 1) {
      options = dataOrOptions as MarkerCollectionOptions<TUserData>;
    } else {
      data = dataOrOptions as TUserData[];
      options = optOptions as NonNullable<typeof optOptions>;
    }

    const {map, key, ...attributes} = options;

    this.key = key;
    this.markerAttributes_ = attributes;
    this.setData(data);

    if (map) {
      this.map = map;
    }
  }

  /** Returns the Google Map instance this collection was added to. */
  get map(): google.maps.Map | null {
    return this.map_;
  }

  /**
   * Adds this collection to the specified map instance. This will add all
   * markers to the map.
   */
  set map(map: google.maps.Map | null) {
    if (map === this.map) return;

    this.map_ = map;
    for (const marker of this.markers_.values()) {
      marker.map = map;
    }
  }

  /**
   * Sets or updates the data for this collection. When updating data, the
   * implementation will use the key-function provided with the Options to
   * detrmine which records were added, removed or changed and update the
   * underlying marker instances accordingly.
   *
   * @param data
   */
  setData(data: TUserData[]) {
    const keyedData = new Map(data.map(r => [this.generateKey(r), r]));
    const currentKeys = new Set(this.markers_.keys());
    const newKeys = new Set(keyedData.keys());

    const toRemove = [...currentKeys].filter(k => !newKeys.has(k));
    const toAdd = [...newKeys].filter(k => !currentKeys.has(k));
    const toUpdate = [...newKeys].filter(k => currentKeys.has(k));

    for (const key of toRemove) {
      const m = this.markers_.get(key) as Marker;
      m.map = null;

      this.markers_.delete(key);
    }

    const options = {
      map: this.map,
      ...this.markerAttributes_
    };

    for (const key of toAdd) {
      const marker = this.createMarker(
        options,
        keyedData.get(key) as TUserData
      );
      this.markers_.set(key, marker);
    }

    if (toUpdate.length > 0 && !this.key) {
      warnOnce(
        `MarkerCollection: updating markers without a key can ` +
          `cause performance issues. Add an attribute named 'key' to the ` +
          `marker-collection to make records identifyable.`
      );
    }

    for (const key of toUpdate) {
      const marker = this.markers_.get(key) as Marker;
      const data = keyedData.get(key) as TUserData;

      marker.setData(data);
    }
  }

  /**
   * Sets the attributes for all markers.
   *
   * @param attributes
   */
  setAttributes(attributes: Partial<Attributes<TUserData>>) {
    this.markerAttributes_ = attributes;

    for (const marker of this.markers_.values()) {
      marker.setAttributes(attributes);
    }
  }

  /**
   * Generates a key for the passed user-data record. This implementation calls
   * the key-function if specified or generates a random key and stores it.
   *
   * @param record
   */
  protected generateKey(record: TUserData): string {
    if (!this.key) {
      // if we don't have a key-function, we use a WeakMap to store
      // generated keys and issue a warning when updating.
      let key = this.generatedKeyCache_.get(record);
      if (!key) {
        key = Math.random().toString(36).slice(2);
        this.generatedKeyCache_.set(record, key);
      }
      return key;
    }

    return this.key(record);
  }

  /**
   * Creates a new Marker with the specified options and data.
   *
   * @param options
   * @param data
   */
  protected createMarker(
    options: MarkerOptions<TUserData>,
    data: TUserData
  ): Marker<TUserData> {
    return new Marker(options, data);
  }
}
