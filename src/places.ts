import {Marker, MarkerOptions} from './marker';

export type PlaceMarkerOptions = {
  place?: google.maps.places.PlaceResult;
} & MarkerOptions<google.maps.places.PlaceResult>;

export class PlaceMarker extends Marker<google.maps.places.PlaceResult> {
  private place_: google.maps.places.PlaceResult | null = null;

  constructor(
    options: PlaceMarkerOptions,
    data?: google.maps.places.PlaceResult
  ) {
    if (options.place) {
      data = options.place;
    }
    super(
      {
        position: ({data}) => data?.geometry?.location?.toJSON(),
        color: ({data}) => data?.icon_background_color as string,
        glyphColor: () => '#ffff',
        glyph: ({data}) =>
          data?.icon_mask_base_uri &&
          new URL(`${data?.icon_mask_base_uri}.svg`),
        ...options
      },
      data
    );
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
