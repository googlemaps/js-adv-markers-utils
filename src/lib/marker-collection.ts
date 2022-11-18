import type {Attributes} from './marker';

export class MarkerCollection<TUserData extends object = Record<any, any>> {
  constructor(data: TUserData[], attributes: Attributes<TUserData>) {}

  static fromArray<TUserData extends object = Record<any, any>>(
    data: TUserData[],
    attributes: Attributes<TUserData>
  ): MarkerCollection {
    return new MarkerCollection(data, attributes);
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
