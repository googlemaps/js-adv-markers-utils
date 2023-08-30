// Copyright 2023 Google LLC.
// SPDX-License-Identifier: Apache-2.0

// title: simple marker for google places API PlaceResult
import {Marker} from '@googlemaps/adv-markers-utils';

export default (map: google.maps.Map) => {
  const marker = new Marker<google.maps.places.PlaceResult>({
    position: ({data}) => data?.geometry?.location?.toJSON(),
    backgroundColor: ({data}) => data?.icon_background_color,
    borderColor: ({data}) => data?.icon_background_color,
    glyph: ({data}) =>
      data?.icon_mask_base_uri && new URL(data.icon_mask_base_uri + '.svg'),
    map
  });
  marker.setData(loadData());
};

function loadData() {
  return {
    geometry: {
      location: new google.maps.LatLng({lat: 53.5544977, lng: 10.0073303})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/generic_pinlet'
  };
}
