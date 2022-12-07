import {Marker} from './marker';
import type {Attributes} from './marker';

export class MarkerCollection<
  TUserData extends Record<string, unknown> = Record<string, unknown>
> {
  private map_: google.maps.Map | null = null;
  private markers_: Marker<TUserData>[] = [];

  constructor(data: TUserData[], attributes: Partial<Attributes<TUserData>>) {
    for (const record of data) {
      this.markers_.push(new Marker<TUserData>(attributes, record));
    }
  }

  static fromArray<
    TUserData extends Record<string, unknown> = Record<string, unknown>
  >(
    data: TUserData[],
    attributes: Partial<Attributes<TUserData>>
  ): MarkerCollection<TUserData> {
    return new MarkerCollection<TUserData>(data, attributes);
  }

  get map(): google.maps.Map | null {
    return this.map_;
  }

  set map(map: google.maps.Map | null) {
    if (map === this.map) return;

    this.map_ = map;
    for (const marker of this.markers_) {
      marker.map = map;
    }
  }

  setData(data: TUserData[]) {
    // how can we identify
  }

  // a collection provides bindings between an array of records and
  // the corresponding markers.

  // - attributes: attributes are shared with all markers, which is where
  //   dynamic attributes can really shine
  //
  // - data-updates: data in the collection can be updated after creation.
  //   This will assume that complete sets of records are passed on every
  //   update. If incremental updates are needed, those have to be applied
  //   to the data before updating the marker collection.
  //   When transitions are implemented (also for performance reasons), it
  //   will become important to recognize identical records, so those can be
  //   updated instead of re-created with every update.
  // -

  // .map property: forwards to all markers
  // marker.visible attribute
}
