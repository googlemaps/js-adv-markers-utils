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

// title: multiple markers / single selection (alternative w/ 'style objects')
import {Attributes, Marker} from '@googlemaps/marker';

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default (map: google.maps.Map) => {
  const markers: Marker[] = [];
  const bounds = new google.maps.LatLngBounds();

  //

  const defaultStyle: Partial<Attributes> = {
    color: '#4285F4',
    scale: ({marker}) => (marker.hovered ? 1.3 : 1.2)
  };
  const selectedStyle = {...defaultStyle, color: '#DB4437'};

  //

  let selectedMarker: Marker | null = null;

  // create a couple of random markers
  for (let i = 0; i < 10; i++) {
    const position = {lat: rnd(53.5, 53.6), lng: rnd(9.9, 10.1)};
    bounds.extend(position);

    const marker = new Marker({
      map,
      position,
      ...defaultStyle
    });

    marker.addListener('click', () => {
      if (selectedMarker !== null) {
        selectedMarker.setAttributes(defaultStyle);
      }

      const marker = markers[i];
      marker.setAttributes(selectedStyle);
      selectedMarker = marker;
    });

    markers.push(marker);
  }

  map.fitBounds(bounds);
};
