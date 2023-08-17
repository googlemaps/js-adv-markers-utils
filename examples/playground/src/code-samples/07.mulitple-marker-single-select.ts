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

// title: multiple markers / single selection (w/ user-data)
import {Marker} from '@googlemaps/adv-markers-utils';

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default (map: google.maps.Map) => {
  const markers: Marker[] = [];
  const bounds = new google.maps.LatLngBounds();

  let selectedMarker: Marker | null = null;
  const setSelected = (index: number) => {
    if (selectedMarker !== null) {
      selectedMarker.setData({selected: false});
    }

    const marker = markers[index];
    marker.setData({selected: true});
    selectedMarker = marker;
  };

  // create a couple of random markers
  for (let i = 0; i < 10; i++) {
    const position = {lat: rnd(53.5, 53.6), lng: rnd(9.9, 10.1)};
    bounds.extend(position);

    const marker = new Marker(
      {
        map,
        position,
        color: ({data}) => (data?.selected ? '#DB4437' : '#4285F4')
      },
      // initial user-data
      {selected: false}
    );

    marker.addListener('click', () => {
      console.log('marker clicked:', marker);
      setSelected(i);
    });

    markers.push(marker as Marker);
  }

  map.fitBounds(bounds);
};
