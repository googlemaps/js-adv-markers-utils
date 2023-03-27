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

// title: marker interactivity: hover
import {Marker} from '@googlemaps/marker';

export default (map: google.maps.Map) => {
  const position = {lat: 53.5, lng: 10};
  const marker = new Marker({map, position});

  marker.scale = ({marker}) => (marker.hovered ? 1.8 : 1.5);
  marker.color = ({marker}) => (marker.hovered ? '#4285F4' : '#F4B400');

  map.setCenter(position);
};
