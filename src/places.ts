import {Marker, MarkerOptions} from './marker';

export type PlaceMarkerOptions = {
  place?: google.maps.places.PlaceResult;
} & MarkerOptions<google.maps.places.PlaceResult>;

/**
 * A special marker class for data from the Google Maps Places API. Uses the
 * recommended colors and icons from a place result.
 */
export class PlaceMarker extends Marker<google.maps.places.PlaceResult> {
  private place_: google.maps.places.PlaceResult | null = null;

  constructor(
    options: PlaceMarkerOptions,
    data?: google.maps.places.PlaceResult
  ) {
    if (options.place) {
      data = options.place;
    }

    super(options, data);

    this.attributeDefaults_ = {
      position: ({data}) => data?.geometry?.location?.toJSON(),
      color: ({data}) => data?.icon_background_color as string,
      glyphColor: () => '#ffff',
      glyph: ({data}) =>
        data?.icon_mask_base_uri && new URL(`${data?.icon_mask_base_uri}.svg`)
    };
  }

  get place(): google.maps.places.PlaceResult | null {
    return this.place_;
  }

  set place(place: google.maps.places.PlaceResult | null) {
    this.place_ = place;
    if (place) {
      this.setData(place);
    }
  }
}
