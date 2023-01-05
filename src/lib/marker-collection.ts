import {Marker, MarkerOptions} from './marker';
import type {Attributes} from './marker';
import {warnOnce} from './util';

/**
 * a collection provides bindings between an array of arbitrary records and
 * the corresponding markers.
 *
 * - attributes: attributes are shared with all markers, which is where
 *   dynamic attributes can really shine
 *
 * - data-updates: data in the collection can be updated after creation.
 *   This will assume that complete sets of records are passed on every
 *   update. If incremental updates are needed, those have to be applied
 *   to the data before updating the marker collection.
 *   When transitions are implemented (also for performance reasons), it
 *   will become important to recognize identical records, so those can be
 *   updated instead of re-created with every update.
 */

/**
 * Markers in a collection can have additional (virtual) attributes that
 * are defined here.
 */
export type CollectionMarkerAttributes<T> = Attributes<T> & {
  key: (data: T) => string;
};

export type MarkerCollectionOptions<T> = {
  map?: google.maps.Map | null;
} & Partial<CollectionMarkerAttributes<T>>;

export class MarkerCollection<TUserData extends object = object> {
  private map_: google.maps.Map | null = null;
  private markers_: Map<string, Marker<TUserData>> = new Map();
  private markerAttributes_: Partial<Attributes<TUserData>> = {};
  private key_?: (data: TUserData) => string;

  private generatedKeyCache_ = new WeakMap<TUserData, string>();

  /**
   * Creates a new MarkerCollection without specifying the data yet.
   * This could be useful since fetching the data typically happens at
   * a different time Providing data when creating the marker-collection
   * is optional.
   * @param options
   */
  constructor(options: MarkerCollectionOptions<TUserData>);
  /**
   * Creates a new MarkerCollection with existing data.
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

    this.key_ = key;
    this.markerAttributes_ = attributes;
    this.setData(data);

    if (map) {
      this.map = map;
    }
  }

  get map(): google.maps.Map | null {
    return this.map_;
  }

  set map(map: google.maps.Map | null) {
    if (map === this.map) return;

    this.map_ = map;
    for (const marker of this.markers_.values()) {
      marker.map = map;
    }
  }

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

    if (toUpdate.length > 0 && !this.key_) {
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

  protected generateKey(record: TUserData): string {
    if (!this.key_) {
      // if we don't have a key-function, we use a WeakMap to store
      // generated keys and issue a warning when updating.

      let key = this.generatedKeyCache_.get(record);
      if (!key) {
        key = Math.random().toString(36).slice(2);
        this.generatedKeyCache_.set(record, key);
      }
      return key;
    }

    return this.key_(record);
  }

  protected createMarker(
    options: MarkerOptions<TUserData>,
    data: TUserData
  ): Marker<TUserData> {
    return new Marker(options, data);
  }
}
