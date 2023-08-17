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

// title: dynamic attributes depending on each other

import {Marker} from '@googlemaps/adv-markers-utils';

// dynamic attributes can be written to reliably depend on the current value
// of another attribute, for example to make colors depend on the icon shown
// or make colors depend on each other. Note that this also works when
// depending on other dynamic attributes.
//
// Returning undefined for the borderColor causes the borderColor to be set
// automatically via the color attribute.

export default (map: google.maps.Map) => {
  const marker = new Marker({
    position: {lat: 53.55, lng: 10.05},
    color: ({marker}) => (marker.hovered ? 'red' : 'green'),
    borderColor: ({attr}) => (attr.color === 'red' ? 'black' : undefined)
  });

  marker.map = map;
};
