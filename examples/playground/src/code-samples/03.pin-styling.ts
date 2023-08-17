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

// title: simple marker customizations: color

import {Marker} from '@googlemaps/adv-markers-utils';

export default (map: google.maps.Map) => {
  const m1 = new Marker({map, position: {lat: 50, lng: 10}});
  const m2 = new Marker({map, position: {lat: 50, lng: 11}});
  const m3 = new Marker({map, position: {lat: 51, lng: 10}});
  const m4 = new Marker({map, position: {lat: 51, lng: 11}});
  const m5 = new Marker({map, position: {lat: 50.5, lng: 10.5}});

  // the new color-attribute will update all color-properties of
  // the markers with matching colors (all of these attributes can also be
  // specified with the marker-options in the constructor)
  m1.color = '#4285F4';
  m2.color = '#DB4437';
  m3.color = '#F4B400';
  m4.color = '#0F9D58';

  // alternatively, you can specify your own values for each of the
  // properties, like so:
  m5.backgroundColor = 'white';
  m5.borderColor = 'black';
  m5.glyphColor = 'salmon';

  map.fitBounds(
    new google.maps.LatLngBounds({lat: 49.5, lng: 9.5}, {lat: 51.5, lng: 11.5})
  );
};
