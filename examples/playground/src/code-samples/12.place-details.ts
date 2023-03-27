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

// title: simple marker for google places API PlaceResult
import {Marker} from '@googlemaps/marker';

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
