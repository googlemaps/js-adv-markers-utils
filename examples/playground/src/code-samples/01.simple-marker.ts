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

// title: create marker and add it to the map
import {Marker} from '@googlemaps/adv-markers-utils';

export default (map: google.maps.Map) => {
  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.map = map;

  new Marker({
    map,
    position: {lat: 53.55, lng: 10}
  });
};